const { Payment, Student, Batch, Course, Enrollment, Installment, SalaryPayment, User } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { sequelize, Op } = require('../models');
const { Sequelize } = require('sequelize');

// Generate Receipt Number
const generateReceiptNo = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `RCP-${timestamp}-${random}`;
};

// Helper: Calculate actual cumulative totalPaid from Payment table
const calculateCumulativeTotalPaid = async (studentId, transaction) => {
    try {
        const result = await Payment.findOne({
            where: { studentId, status: 'Paid' },
            attributes: [
                [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('amountPaid')), 0), 'totalPaid']
            ],
            transaction,
            raw: true
        });
        return result?.totalPaid || 0;
    } catch (err) {
        console.error('Error calculating cumulative total:', err);
        return 0;
    }
};

// Create a new payment
const createPayment = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        let { 
            studentId, 
            enrollmentId, 
            courseId,
            amountPaid, 
            paymentMethod, 
            transactionId,
            discount: discountInput
        } = req.body;

        const discountVal = parseFloat(discountInput || 0);
        amountPaid = parseFloat(amountPaid || 0);
        if (studentId) studentId = parseInt(studentId, 10);
        if (enrollmentId) enrollmentId = parseInt(enrollmentId, 10);

        // Validate required fields
        if (!studentId || !amountPaid || !paymentMethod) {
            await transaction.rollback();
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['studentId', 'amountPaid', 'paymentMethod']
            });
        }

        // Validate payment method
        const validMethods = ['Cash', 'Online', 'Bank'];
        if (!validMethods.includes(paymentMethod)) {
            await transaction.rollback();
            return res.status(400).json({
                error: 'Invalid payment method',
                validMethods
            });
        }

        // Fetch student
        const student = await Student.findByPk(studentId, { transaction });
        if (!student) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Student not found' });
        }

        // Auto-find enrollmentId from courseId if not provided
        if (!enrollmentId && courseId) {
            const { Enrollment } = require('../models');
            const foundEnrollment = await Enrollment.findOne({
                where: { studentId, courseId },
                transaction
            });
            if (foundEnrollment) {
                enrollmentId = foundEnrollment.id;
            }
        }

        // Fetch enrollment if provided
        let enrollment = null;
        if (enrollmentId) {
            const { Enrollment } = require('../models');
            enrollment = await Enrollment.findByPk(enrollmentId, { transaction });
            if (!enrollment) {
                await transaction.rollback();
                return res.status(404).json({ error: 'Enrollment not found' });
            }
        }

        // Determine which financial figures to use
        const targetTotalFee = enrollment ? enrollment.totalFee : (student.totalFee || 0);
        const targetDiscount = enrollment ? enrollment.discount : (student.discount || 0);

        // Calculate cumulative paid for this SPECIFIC target
        let cumulativeTargetPaid = 0;
        if (enrollmentId) {
            const result = await Payment.findOne({
                where: { enrollmentId, status: 'Paid' },
                attributes: [[Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('amountPaid')), 0), 'totalPaid']],
                transaction,
                raw: true
            });
            cumulativeTargetPaid = result?.totalPaid || 0;
        } else {
            cumulativeTargetPaid = await calculateCumulativeTotalPaid(studentId, transaction);
        }
        
        // Calculate remaining balance (taking existing discount into account)
        const currentRemaining = parseFloat(targetTotalFee || 0) - parseFloat(cumulativeTargetPaid || 0) - parseFloat(targetDiscount || 0);
        
        // Validate payment amount + discount doesn't exceed remaining balance
        if (amountPaid + discountVal > currentRemaining + 0.01) { // 0.01 for float precision
            await transaction.rollback();
            return res.status(400).json({
                error: 'Payment amount and discount exceed remaining balance',
                remainingBalance: Math.max(0, currentRemaining),
                requestedAmount: amountPaid,
                requestedDiscount: discountVal
            });
        }

        // Validate amount is positive
        if (amountPaid <= 0) {
            await transaction.rollback();
            return res.status(400).json({ error: 'Payment amount must be greater than zero' });
        }

        // Create payment record
        const newRemainingBalance = Math.max(0, currentRemaining - amountPaid - discountVal);

        // 🔥 Generate unique receipt number
        const receiptNo = generateReceiptNo();

        // Determine Installment No
        let installmentNo = 1;
        if (enrollmentId) {
            const paymentCount = await Payment.count({ where: { enrollmentId, status: 'Paid' }, transaction });
            installmentNo = paymentCount + 1;
        }

        const slipUrl = req.file ? `/uploads/slips/${req.file.filename}` : null;

        const payment = await Payment.create({
            studentId,
            enrollmentId: enrollmentId || null,
            installmentNo,
            amountPaid,
            discount: discountVal,
            paymentDate: new Date(),
            paymentMethod,
            transactionId: transactionId || null,
            receiptNo,
            remainingBalance: newRemainingBalance,
            status: 'Paid',
            slipUrl
        }, { transaction });

        // 🔥 CRITICAL FIX: Recalculate totalPaid from Payment table and update Student record
        const updatedCumulativeTotalPaid = await calculateCumulativeTotalPaid(studentId, transaction);
        
        // 🔥 NEW: Increment next_due_date by 1 month after successful payment
        let nextDueDate = student.next_due_date;
        if (nextDueDate) {
            const newDate = new Date(nextDueDate);
            newDate.setMonth(newDate.getMonth() + 1);
            nextDueDate = newDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        }

        // Update student
        await student.update({
            discount: parseFloat(student.discount || 0) + discountVal,
            totalPaid: updatedCumulativeTotalPaid,
            paidAmount: updatedCumulativeTotalPaid,
            next_due_date: nextDueDate  // Update next due date
        }, { transaction });

        // Update enrollment if applicable
        if (enrollment) {
            await enrollment.update({
                discount: parseFloat(enrollment.discount || 0) + discountVal
            }, { transaction });
        }

        // 🔥 NEW: Mark the earliest 'Pending' installment as 'Paid' for this enrollment
        if (enrollmentId) {
            const { InstallmentSchedule } = require('../models');
            const earliestPending = await InstallmentSchedule.findOne({
                where: { enrollmentId, status: 'Pending' },
                order: [['dueDate', 'ASC']],
                transaction
            });

            if (earliestPending) {
                // If payment covers the entire installment amount (or close to it)
                // For now, we'll mark one as 'Paid' per payment event
                await earliestPending.update({ status: 'Paid' }, { transaction });
            }
        }

        // Commit transaction 
        await transaction.commit();

        // Return payment with UPDATED student info
        const paymentWithStudent = await Payment.findByPk(payment.id, {
            include: [{ model: Student, attributes: ['id', 'name', 'totalFee', 'totalPaid', 'discount', 'paidAmount'] }]
        });

        res.status(201).json({
            success: true,
            message: 'Payment recorded successfully',
            payment: paymentWithStudent,
            student: paymentWithStudent.Student,
            receiptNo: payment.receiptNo,
            cumulativeTotalPaid: updatedCumulativeTotalPaid,
            remainingBalance: newRemainingBalance
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Create payment error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

// Get all payments for a student
const getPaymentsByStudent = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { courseId, enrollmentId } = req.query;

        // Validate student exists
        const student = await Student.findByPk(studentId);
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        let filterEnrollmentId = enrollmentId;
        if (!filterEnrollmentId && courseId) {
            const { Enrollment } = require('../models');
            const enrollment = await Enrollment.findOne({
                where: { studentId, courseId }
            });
            if (enrollment) {
                filterEnrollmentId = enrollment.id;
            }
        }

        const where = { studentId };
        if (filterEnrollmentId) {
            where.enrollmentId = filterEnrollmentId;
        }

        // Fetch all payments for the student
        const payments = await Payment.findAll({
            where,
            include: [
                { model: Student, attributes: ['id', 'name', 'totalFee', 'totalPaid', 'discount'] },
                {
                    model: Enrollment,
                    include: [
                        { model: Course, as: 'Course', attributes: ['id', 'name'] }
                    ]
                }
            ],
            order: [['paymentDate', 'DESC']]
        });

        // Calculate dynamic balances from database
        let cumulativeTotalPaid = 0;
        let totalFee = student.totalFee || 0;
        let discount = student.discount || 0;

        if (filterEnrollmentId) {
            const { Enrollment } = require('../models');
            const enr = await Enrollment.findByPk(filterEnrollmentId);
            if (enr) {
                totalFee = parseFloat(enr.totalFee || 0);
                discount = parseFloat(enr.discount || 0);
            }
            const result = await Payment.findOne({
                where: { enrollmentId: filterEnrollmentId, status: 'Paid' },
                attributes: [[Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('amountPaid')), 0), 'totalPaid']],
                raw: true
            });
            cumulativeTotalPaid = parseFloat(result?.totalPaid || 0);
        } else {
            cumulativeTotalPaid = await calculateCumulativeTotalPaid(studentId);
        }

        const remainingBalance = totalFee - cumulativeTotalPaid - discount;

        // Calculate summary
        const summary = {
            totalPayments: payments.length,
            totalAmount: payments.reduce((sum, p) => sum + parseFloat(p.amountPaid || 0), 0),
            remainingBalance: Math.max(0, remainingBalance),
            totalFee,
            totalPaid: cumulativeTotalPaid,
            discount
        };

        res.json({
            success: true,
            payments,
            summary
        });
    } catch (error) {
        console.error('Get payments error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

// Get all payments (admin view)
const getAllPayments = async (req, res) => {
    try {
        const payments = await Payment.findAll({
            include: [{ model: Student, attributes: ['id', 'name', 'email', 'totalFee', 'totalPaid'] }],
            order: [['paymentDate', 'DESC']]
        });

        res.json({
            success: true,
            totalPayments: payments.length,
            payments
        });
    } catch (error) {
        console.error('Get all payments error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

// Get payment by receipt number
const getPaymentByReceipt = async (req, res) => {
    try {
        const { receiptNo } = req.params;

        const payment = await Payment.findOne({
            where: { receiptNo },
            include: [{ model: Student, attributes: ['id', 'name', 'email', 'totalFee', 'totalPaid'] }]
        });

        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        res.json({
            success: true,
            payment
        });
    } catch (error) {
        console.error('Get payment by receipt error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

// Get remaining balance for a student
const getRemainingBalance = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { courseId } = req.query;

        const student = await Student.findByPk(studentId);
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        if (courseId) {
            const { Enrollment } = require('../models');
            const enrollment = await Enrollment.findOne({
                where: { studentId, courseId }
            });
            if (!enrollment) {
                return res.status(404).json({ error: 'Enrollment not found for student and course' });
            }

            const result = await Payment.findOne({
                where: { enrollmentId: enrollment.id, status: 'Paid' },
                attributes: [[Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('amountPaid')), 0), 'totalPaid']],
                raw: true
            });
            const totalPaid = parseFloat(result?.totalPaid || 0);
            const remainingBalance = parseFloat(enrollment.totalFee || 0) - parseFloat(enrollment.discount || 0) - totalPaid;

            return res.json({
                success: true,
                studentId,
                courseId,
                enrollmentId: enrollment.id,
                totalFee: enrollment.totalFee || 0,
                totalPaid,
                discount: enrollment.discount || 0,
                remainingBalance: Math.max(0, remainingBalance)
            });
        } else {
            // General student-wide sum
            const cumulativeTotalPaid = await calculateCumulativeTotalPaid(studentId);
            const remainingBalance = (student.totalFee || 0) - cumulativeTotalPaid - (student.discount || 0);

            res.json({
                success: true,
                studentId,
                totalFee: student.totalFee || 0,
                totalPaid: cumulativeTotalPaid,
                discount: student.discount || 0,
                remainingBalance: Math.max(0, remainingBalance)
            });
        }
    } catch (error) {
        console.error('Get remaining balance error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

// 🔥 NEW: Optimized Alert Dashboard Logic (categorized by installments)
const getRecoveryAlerts = async (req, res) => {
    try {
        const { InstallmentSchedule, Enrollment, Student, Course, Batch } = require('../models');
        const today = new Date();
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(today.getDate() + 3);

        const schedules = await InstallmentSchedule.findAll({
            where: { status: 'Pending' },
            include: [{
                model: Enrollment,
                include: [
                    { model: Student, attributes: ['id', 'name', 'phone', 'email'] },
                    { model: Course, as: 'Course', attributes: ['id', 'name'] },
                    { model: Batch, as: 'Batch', attributes: ['id', 'name'] }
                ]
            }],
            order: [['dueDate', 'ASC']]
        });

        const alerts = schedules.map(sch => {
            const dueDate = new Date(sch.dueDate);
            let category = 'FUTURE';

            // Reset time part for accurate comparison
            today.setHours(0,0,0,0);
            dueDate.setHours(0,0,0,0);

            if (dueDate < today) {
                category = 'OVERDUE';
            } else if (dueDate <= threeDaysFromNow) {
                category = 'UPCOMING';
            }

            return {
                id: sch.id,
                enrollmentId: sch.enrollmentId,
                studentId: sch.Enrollment?.Student?.id,
                studentName: sch.Enrollment?.Student?.name,
                phone: sch.Enrollment?.Student?.phone,
                courseName: sch.Enrollment?.Course?.name,
                batchName: sch.Enrollment?.Batch?.name,
                dueDate: sch.dueDate,
                amount: sch.amount,
                category,
                daysRemaining: Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24))
            };
        });

        // Filter and Sort: OVERDUE and UPCOMING only
        const sortedAlerts = alerts
            .filter(a => a.category !== 'FUTURE')
            .sort((a, b) => {
                if (a.category === 'OVERDUE' && b.category === 'UPCOMING') return -1;
                if (a.category === 'UPCOMING' && b.category === 'OVERDUE') return 1;
                return new Date(a.dueDate) - new Date(b.dueDate);
            });

        res.json({
            success: true,
            count: sortedAlerts.length,
            alerts: sortedAlerts
        });
    } catch (error) {
        console.error('Get recovery alerts error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

// 🔥 NEW: Get pending fees summary (sum of all overdue amounts)
const getPendingFeesSummary = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Get all overdue students
        const overdueStudents = await Student.findAll({
            where: {
                status: 'Active',
                next_due_date: {
                    [Sequelize.Op.lte]: today
                }
            },
            attributes: ['id', 'totalFee', 'discount']
        });

        // Calculate total pending fees
        let totalPendingFees = 0;
        let totalStudentsOverdue = 0;

        for (const student of overdueStudents) {
            const cumulativePaid = await calculateCumulativeTotalPaid(student.id);
            const remaining = (student.totalFee || 0) - cumulativePaid - (student.discount || 0);
            if (remaining > 0) {
                totalPendingFees += remaining;
                totalStudentsOverdue++;
            }
        }

        res.json({
            success: true,
            totalPendingFees,
            totalStudentsOverdue,
            averageOverduePerStudent: totalStudentsOverdue > 0 ? totalPendingFees / totalStudentsOverdue : 0
        });
    } catch (error) {
        console.error('Get pending fees summary error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

// ─── FUNCTION: getStudentLedger ─────────────────────────────────────────────
// GET /api/payments/ledger/:studentId
// Returns a complete financial picture: student info, payment history,
// installment list, and a computed remaining balance.
const getStudentLedger = async (req, res) => {
    try {
        const { studentId } = req.params;

        // 1. Fetch student with fee details
        const student = await Student.findByPk(studentId, {
            attributes: ['id', 'name', 'email', 'phone', 'totalFee', 'paidAmount', 'totalPaid', 'discount', 'status']
        });
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // 2. Fetch all payments ordered newest first
        const payments = await Payment.findAll({
            where: { studentId },
            order: [['paymentDate', 'DESC']]
        });

        // 3. Fetch all installments for this student (Installment model uses student_id)
        let installments = [];
        if (Installment) {
            installments = await Installment.findAll({
                where: { student_id: studentId },
                order: [['due_date', 'ASC']]
            });
        }

        // 4. Calculate real cumulative total paid from Payment table
        const cumulativePaid = await calculateCumulativeTotalPaid(studentId);

        // 5. Compute remaining balance
        const total_fee   = parseFloat(student.totalFee  || 0);
        const paid_amount = parseFloat(cumulativePaid     || 0);
        const discount    = parseFloat(student.discount   || 0);
        const remaining   = Math.max(0, total_fee - paid_amount - discount);

        return res.json({
            success:     true,
            student,
            payments,
            installments,
            total_fee,
            paid_amount,
            remaining
        });
    } catch (error) {
        console.error('getStudentLedger error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

// ─── FUNCTION: markSalaryPaid ────────────────────────────────────────────────
// PATCH /api/salaries/:id/pay
// Marks a SalaryPayment record as PAID and records today as the disbursal date.
// Returns 400 if the record was already disbursed (idempotency guard).
const markSalaryPaid = async (req, res) => {
    try {
        const { id } = req.params;

        const record = await SalaryPayment.findByPk(id);
        if (!record) {
            return res.status(404).json({ error: 'Salary record not found' });
        }

        if (record.status === 'PAID') {
            return res.status(400).json({ error: 'Already disbursed' });
        }

        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        await record.update({
            status:        'PAID',
            disbursal_date: today
        });

        return res.json({
            success: true,
            message: 'Salary marked as paid',
            record
        });
    } catch (error) {
        console.error('markSalaryPaid error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

// ─── FUNCTION: getSalaryReport ───────────────────────────────────────────────
// GET /api/salaries/report?month=MM-YYYY
// Returns all SalaryPayment records for the given month, joined with the
// corresponding User (staff name + email), plus aggregate totals.
const getSalaryReport = async (req, res) => {
    try {
        const { month } = req.query;

        if (!month) {
            return res.status(400).json({ error: 'Query param "month" is required (MM-YYYY)' });
        }

        const records = await SalaryPayment.findAll({
            where: { month_year: month },
            include: [{
                model: User,
                as:    'staff',
                attributes: ['id', 'name', 'email', 'role']
            }],
            order: [['staff_id', 'ASC']]
        });

        // Compute aggregate totals from the result set
        let totalPaid    = 0;
        let totalPending = 0;

        for (const r of records) {
            const pay = parseFloat(r.base_pay || 0);
            if (r.status === 'PAID') {
                totalPaid += pay;
            } else {
                totalPending += pay;
            }
        }

        return res.json({
            success:     true,
            month,
            records,
            totalPaid:    parseFloat(totalPaid.toFixed(2)),
            totalPending: parseFloat(totalPending.toFixed(2))
        });
    } catch (error) {
        console.error('getSalaryReport error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

module.exports = {
    createPayment,
    getPaymentsByStudent,
    getAllPayments,
    getPaymentByReceipt,
    getRemainingBalance,
    getRecoveryAlerts,
    getPendingFeesSummary,
    getStudentLedger,
    markSalaryPaid,
    getSalaryReport
};
