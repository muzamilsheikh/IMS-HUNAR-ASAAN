/**
 * reportsController.js - Comprehensive Financial Reporting System
 * Handles monthly, yearly, and custom date range reports
 */

const { Student, Payment, Expense, Course, Collaboration, Batch } = require('../models');
const { sequelize } = require('../models');
const { Sequelize } = require('sequelize');

// GET /api/reports - Generate comprehensive report for date range
const generateReport = async (req, res) => {
  try {
   const { startDate, endDate, type, batchId } = req.query;

    // Validate dates
   if (!startDate || !endDate) {
     return res.status(400).json({ 
       error: 'Start date and end date are required',
        example: '?startDate=2024-01-01&endDate=2024-12-31&type=custom'
      });
    }

   const start = new Date(startDate);
   const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include entire end date

   const hasBatchFilter = batchId && batchId !== 'all';
   console.log(`📊 Generating report from ${start.toISOString()} to ${end.toISOString()}${hasBatchFilter ? ` | Batch: ${batchId}` : ' | All Batches'}`);

    // Build student where clause
   const studentWhere = {
      createdAt: {
        [Sequelize.Op.between]: [start, end]
      }
    };
   if (hasBatchFilter) {
      studentWhere.batchId = parseInt(batchId);
    }

    // 1. Total Collections (Revenue) in period
   let totalCollections;
   if (hasBatchFilter) {
      const batchStudents = await Student.findAll({
        where: studentWhere,
        attributes: ['id'],
        raw: true
      });
      const batchStudentIds = batchStudents.map(s => s.id);
      
      if (batchStudentIds.length > 0) {
        const collectionsResult = await Payment.findOne({
          attributes: [
            [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('amountPaid')), 0), 'totalCollections']
          ],
          where: {
            status: 'Paid',
            paymentDate: { [Sequelize.Op.between]: [start, end] },
            studentId: { [Sequelize.Op.in]: batchStudentIds }
          },
          raw: true
        });
        totalCollections = parseFloat(collectionsResult?.totalCollections || 0);
      } else {
        totalCollections = 0;
      }
    } else {
      const collectionsResult = await Payment.findOne({
        attributes: [
          [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('amountPaid')), 0), 'totalCollections']
        ],
        where: {
          status: 'Paid',
          paymentDate: { [Sequelize.Op.between]: [start, end] }
        },
        raw: true
      });
      totalCollections = parseFloat(collectionsResult?.totalCollections || 0);
    }

    // 2. Operational Costs (Expenses) — batch/course specific filtering when batchId is provided
    let expenseWhere = {
      date: { [Sequelize.Op.between]: [start, end] }
    };

    if (hasBatchFilter) {
      const targetBatch = await Batch.findByPk(parseInt(batchId));
      const targetCourseId = targetBatch ? targetBatch.courseId : null;

      expenseWhere = {
        date: { [Sequelize.Op.between]: [start, end] },
        [Sequelize.Op.or]: [
          { batchId: parseInt(batchId) },
          ...(targetCourseId ? [{ courseId: targetCourseId }] : [])
        ]
      };
    }

   const expensesResult = await Expense.findOne({
      attributes: [
        [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('amount')), 0), 'totalExpenses']
      ],
      where: expenseWhere,
      raw: true
    });
   const operationalCosts = parseFloat(expensesResult?.totalExpenses || 0);

    // 3. Partner & Trainer Payouts Calculation
    let totalPartnerPayouts = 0;
    const activeCollabs = await Collaboration.findAll({ where: { status: 'Active' }, raw: true });

    if (hasBatchFilter) {
      const bId = parseInt(batchId);
      const targetBatch = await Batch.findByPk(bId);
      const cId = targetBatch ? targetBatch.courseId : null;

      const batchCollab = activeCollabs.find(c => c.batchId === bId) ||
                          activeCollabs.find(c => c.courseId === cId);

      if (batchCollab) {
        if (batchCollab.payoutType === 'percentage') {
          totalPartnerPayouts = (totalCollections * (parseFloat(batchCollab.rateValue) || 0)) / 100;
        } else if (batchCollab.payoutType === 'fixed_per_student') {
          const studentCount = await Student.count({ where: studentWhere });
          totalPartnerPayouts = studentCount * (parseFloat(batchCollab.rateValue) || 0);
        } else if (batchCollab.payoutType === 'fixed_per_class') {
          totalPartnerPayouts = parseFloat(batchCollab.rateValue) || 0;
        }
      }
    } else {
      // Calculate overall partner payouts across all active collaborations
      for (const collab of activeCollabs) {
        let collabRevenue = 0;
        let studentCount = 0;
        if (collab.batchId) {
          const batchStudents = await Student.findAll({ where: { batchId: collab.batchId }, attributes: ['id'], raw: true });
          const bStudentIds = batchStudents.map(s => s.id);
          studentCount = bStudentIds.length;
          if (bStudentIds.length > 0) {
            const pRes = await Payment.findOne({
              attributes: [[Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('amountPaid')), 0), 'tot']],
              where: { status: 'Paid', paymentDate: { [Sequelize.Op.between]: [start, end] }, studentId: { [Sequelize.Op.in]: bStudentIds } },
              raw: true
            });
            collabRevenue = parseFloat(pRes?.tot || 0);
          }
        }

        if (collab.payoutType === 'percentage') {
          totalPartnerPayouts += (collabRevenue * (parseFloat(collab.rateValue) || 0)) / 100;
        } else if (collab.payoutType === 'fixed_per_student') {
          totalPartnerPayouts += studentCount * (parseFloat(collab.rateValue) || 0);
        } else if (collab.payoutType === 'fixed_per_class') {
          totalPartnerPayouts += parseFloat(collab.rateValue) || 0;
        }
      }
    }

    // 4. Net Realized Profit per period after expenses and partner share
   const netProfit = totalCollections - operationalCosts - totalPartnerPayouts;

    // 5. Students & Outstanding Fees
   const studentsData = await Student.findAll({
      where: studentWhere,
      include: [
        { model: Course, attributes: ['name', 'fee'] }
      ]
    });

   let totalPending = 0;
   const studentsList = [];
   
   for (const student of studentsData) {
     const studentPayments = await Payment.findOne({
      attributes: [
        [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('amountPaid')), 0), 'cumulativePaid']
      ],
      where: {
        studentId: student.id,
        status: 'Paid',
        paymentDate: {
          [Sequelize.Op.between]: [start, end]
        }
      },
      raw: true
     });
     
     const cumulativePaid = parseFloat(studentPayments?.cumulativePaid || 0);
     const totalFee = parseFloat(student.totalFee || 0);
     const discount = parseFloat(student.discount || 0);
     const remaining = totalFee - cumulativePaid - discount;
     const pending = Math.max(0, remaining);
     
     totalPending += pending;

     const isEnrolled = student.status === 'Active' || student.status === 'Settled' || !student.status;
     const enrollmentStatus = student.status ? student.status : (isEnrolled ? 'Enrolled' : 'Lead');
     
     let feeStatus = 'Paid';
     if (pending > 0) {
       if (cumulativePaid === 0) {
         feeStatus = 'Unpaid';
       } else {
         feeStatus = 'Partial';
       }
     }
     
     studentsList.push({
       id: student.id,
       name: student.name,
       code: student.customId || 'N/A',
       course: student.Course ? student.Course.name : 'Unknown',
       phone: student.phone || 'N/A',
       enrollmentStatus,
       feeStatus,
       totalFee: totalFee - discount,
       paid: cumulativePaid,
       pending: pending
     });
   }

    // 6. Detailed Batch & Course Breakdown
    const allBatches = hasBatchFilter 
      ? await Batch.findAll({ where: { id: parseInt(batchId) }, include: [Course] })
      : await Batch.findAll({ include: [Course] });

    const batchBreakdown = [];
    for (const b of allBatches) {
      const bId = b.id;
      const cId = b.courseId;
      
      const bStudents = await Student.findAll({ where: { batchId: bId }, attributes: ['id'], raw: true });
      const bStudentIds = bStudents.map(s => s.id);
      
      let bCollections = 0;
      if (bStudentIds.length > 0) {
        const colRes = await Payment.findOne({
          attributes: [[Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('amountPaid')), 0), 'tot']],
          where: { status: 'Paid', paymentDate: { [Sequelize.Op.between]: [start, end] }, studentId: { [Sequelize.Op.in]: bStudentIds } },
          raw: true
        });
        bCollections = parseFloat(colRes?.tot || 0);
      }
      
      const expRes = await Expense.findOne({
        attributes: [[Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('amount')), 0), 'tot']],
        where: {
          date: { [Sequelize.Op.between]: [start, end] },
          [Sequelize.Op.or]: [
            { batchId: bId },
            ...(cId ? [{ courseId: cId }] : [])
          ]
        },
        raw: true
      });
      const bExpenses = parseFloat(expRes?.tot || 0);
      
      let bPartnerShare = 0;
      const bCollabs = activeCollabs.filter(c => c.batchId === bId || (!c.batchId && c.courseId === cId));
      for (const collab of bCollabs) {
        if (collab.payoutType === 'percentage') {
          bPartnerShare += (bCollections * (parseFloat(collab.rateValue) || 0)) / 100;
        } else if (collab.payoutType === 'fixed_per_student') {
          const studentCount = await Student.count({ where: { batchId: bId, createdAt: { [Sequelize.Op.between]: [start, end] } } });
          bPartnerShare += studentCount * (parseFloat(collab.rateValue) || 0);
        } else if (collab.payoutType === 'fixed_per_class') {
          bPartnerShare += parseFloat(collab.rateValue) || 0;
        }
      }
      
      batchBreakdown.push({
        batchId: bId,
        batchName: b.name,
        courseName: b.Course ? b.Course.name : 'Unknown Course',
        collections: Math.round(bCollections * 100) / 100,
        expenses: Math.round(bExpenses * 100) / 100,
        partnerShare: Math.round(bPartnerShare * 100) / 100,
        netIncome: Math.round((bCollections - bExpenses - bPartnerShare) * 100) / 100
      });
    }

    // 7. Itemized Operational Expenses Log
    const itemizedExpensesData = await Expense.findAll({
      where: expenseWhere,
      include: [
        { model: Course, attributes: ['name'] },
        { model: Batch, attributes: ['name'] }
      ],
      order: [['date', 'ASC']]
    });

    const itemizedExpenses = itemizedExpensesData.map(e => ({
      id: e.id,
      description: e.description,
      category: e.category,
      amount: parseFloat(e.amount) || 0,
      date: e.date,
      courseName: e.Course ? e.Course.name : null,
      batchName: e.Batch ? e.Batch.name : null
    }));

    // 8. Partner & Trainer Commission Ledger
    const commissionLedger = [];
    for (const collab of activeCollabs) {
      if (hasBatchFilter) {
        const bId = parseInt(batchId);
        const targetBatch = await Batch.findByPk(bId);
        const cId = targetBatch ? targetBatch.courseId : null;
        if (collab.batchId !== bId && collab.courseId !== cId) {
          continue;
        }
      }

      let collabRevenue = 0;
      let studentCount = 0;
      let targetName = 'All Enrollments';
      
      if (collab.batchId) {
        const bObj = await Batch.findByPk(collab.batchId);
        targetName = bObj ? `Batch: ${bObj.name}` : 'Unknown Batch';
        const batchStudents = await Student.findAll({ where: { batchId: collab.batchId }, attributes: ['id'], raw: true });
        const bStudentIds = batchStudents.map(s => s.id);
        studentCount = await Student.count({ where: { batchId: collab.batchId, createdAt: { [Sequelize.Op.between]: [start, end] } } });
        if (bStudentIds.length > 0) {
          const pRes = await Payment.findOne({
            attributes: [[Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('amountPaid')), 0), 'tot']],
            where: { status: 'Paid', paymentDate: { [Sequelize.Op.between]: [start, end] }, studentId: { [Sequelize.Op.in]: bStudentIds } },
            raw: true
          });
          collabRevenue = parseFloat(pRes?.tot || 0);
        }
      } else if (collab.courseId) {
        const cObj = await Course.findByPk(collab.courseId);
        targetName = cObj ? `Course: ${cObj.name}` : 'Unknown Course';
        const courseStudents = await Student.findAll({ where: { courseId: collab.courseId }, attributes: ['id'], raw: true });
        const cStudentIds = courseStudents.map(s => s.id);
        studentCount = await Student.count({ where: { courseId: collab.courseId, createdAt: { [Sequelize.Op.between]: [start, end] } } });
        if (cStudentIds.length > 0) {
          const pRes = await Payment.findOne({
            attributes: [[Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('amountPaid')), 0), 'tot']],
            where: { status: 'Paid', paymentDate: { [Sequelize.Op.between]: [start, end] }, studentId: { [Sequelize.Op.in]: cStudentIds } },
            raw: true
          });
          collabRevenue = parseFloat(pRes?.tot || 0);
        }
      }

      let calculatedAmount = 0;
      let rateDisplay = '';
      if (collab.payoutType === 'percentage') {
        calculatedAmount = (collabRevenue * (parseFloat(collab.rateValue) || 0)) / 100;
        rateDisplay = `${collab.rateValue}% Split`;
      } else if (collab.payoutType === 'fixed_per_student') {
        calculatedAmount = studentCount * (parseFloat(collab.rateValue) || 0);
        rateDisplay = `Rs. ${parseFloat(collab.rateValue).toLocaleString()} / Student (${studentCount} Enrolled)`;
      } else if (collab.payoutType === 'fixed_per_class') {
        calculatedAmount = parseFloat(collab.rateValue) || 0;
        rateDisplay = `Rs. ${parseFloat(collab.rateValue).toLocaleString()} Flat`;
      }

      commissionLedger.push({
        id: collab.id,
        partnerName: collab.partnerName,
        payoutType: collab.payoutType,
        rateValue: collab.rateValue,
        rateDisplay,
        targetName,
        calculatedAmount: Math.round(calculatedAmount * 100) / 100
      });
    }

    // Compile final report matching frontend expectations
   const report = {
      period: {
       startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        type: type || 'custom',
        batchId: hasBatchFilter ? parseInt(batchId) : null
      },
      totalRevenue: Math.round(totalCollections * 100) / 100,
      totalExpenses: Math.round(operationalCosts * 100) / 100,
      partnerPayouts: Math.round(totalPartnerPayouts * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
      totalPending: Math.round(totalPending * 100) / 100,
      students: studentsList,
      batchBreakdown,
      itemizedExpenses,
      commissionLedger
    };

   res.json({
     success: true,
     data: report,
     generatedAt: new Date().toISOString()
    });

  } catch (error) {
   console.error('❌ Report generation error:', error);
   res.status(500).json({ 
     success: false, 
     error: error.message || 'Failed to generate report' 
    });
  }
};

module.exports = {
  generateReport
};
