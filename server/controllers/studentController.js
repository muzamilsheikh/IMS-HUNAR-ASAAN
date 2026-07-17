const { Student, User, Course, Batch, ChatGroup, Op, InstallmentSchedule, Payment, Enrollment, Installment, Setting } = require('../models');
const bcrypt = require('bcryptjs');
const { sendEmail, sendAdminManagerNotification, generateRandomPassword } = require('../utils/email');
const { logActivity } = require('../utils/activity');
const { getWelcomeTemplate } = require('../utils/emailTemplates');
const { generateChallanPDF } = require('../utils/pdfGenerator');

// Live uniqueness check - GET /api/students/check-exists?field=email&value=...
const checkStudentExists = async (req, res) => {
  try {
    const { field, value, excludeId } = req.query;
    const allowedFields = ['email', 'phone', 'cnic'];
    if (!allowedFields.includes(field)) {
      return res.status(400).json({ error: 'Invalid field' });
    }
    if (!value || !value.trim()) {
      return res.json({ exists: false });
    }
    const where = { [field]: value.trim() };
    if (excludeId) {
      where.id = { [Op.ne]: parseInt(excludeId) };
    }
    const student = await Student.findOne({ where });
    return res.json({ exists: !!student });
  } catch (error) {
    console.error('Check exists error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
};

// Get all students (with optional filtering)
const getAllStudents = async (req, res) => {
  try {
  // Build where clause for database filtering
  const where = {};
  const { status, courseId, batchId, search } = req.query;

  if (status) {
    where.status = status;
  }
  if (courseId) {
    where.courseId = parseInt(courseId);
  }
  if (batchId) {
    where.batchId = parseInt(batchId);
  }
  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { customId: { [Op.like]: `%${search}%` } },
      { phone: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } }
    ];
  }

  const students = await Student.findAll({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: [
        { model: Course, attributes: ['id', 'name', 'fee'] },
        { model: Batch, attributes: ['id', 'name'] },
        {
          model: Enrollment,
          as: 'Enrollments',
          include: [
            { model: Course, as: 'Course', attributes: ['id', 'name', 'fee'] }
          ]
        },
        {
          model: Payment,
          attributes: ['id', 'amountPaid', 'paymentDate', 'paymentMethod', 'receiptNo', 'status', 'enrollmentId']
        }
      ],
      order: [['createdAt', 'DESC']],
      raw: false
    });
    
  const studentsWithAggregates = students.map(student => {
    const totalPaid = student.Payments?.reduce((sum, p) => sum + parseFloat(p.amountPaid || 0), 0) || 0;
    const studentTotalFee = student.Enrollments?.reduce((sum, e) => sum + parseFloat(e.totalFee || 0), 0) || (student.totalFee || 0);
    const studentDiscount = student.Enrollments?.reduce((sum, e) => sum + parseFloat(e.discount || 0), 0) || (student.discount || 0);

    const studentJson = student.toJSON();
    studentJson.totalFee = parseFloat(studentTotalFee) || 0;
    studentJson.discount = parseFloat(studentDiscount) || 0;
    studentJson.totalPaid = parseFloat(totalPaid) || 0;
    studentJson.paidAmount = parseFloat(totalPaid) || 0;
    studentJson.payments = studentJson.Payments || [];
    return studentJson;
  });
    
  res.json(studentsWithAggregates);
  } catch (error) {
  console.error('❌ Get all students error:', error.message);
  console.error('Error stack:', error.stack);
  res.status(500).json({ 
      error: error.message || 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get student by ID (with full enrollment history)
const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findByPk(id, {
      include: [
        { model: Course, attributes: ['id', 'name', 'fee', 'code', 'duration'] },
        { model: Batch, attributes: ['id', 'name', 'time'] },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email', 'role'] },
        {
          model: Enrollment,
          as: 'Enrollments',
          include: [
            { 
              model: Course, 
              as: 'Course', 
              attributes: ['id', 'name', 'fee', 'code', 'duration', 'durationValue', 'durationUnit', 'offerInstallments', 'allowed_installments'],
              include: [
                { model: User, as: 'Instructors', attributes: ['id', 'name', 'email'] }
              ]
            },
            { model: Batch,  as: 'Batch',  attributes: ['id', 'name', 'time', 'meetingLink'] },
            { model: InstallmentSchedule, as: 'InstallmentSchedules' },
            { model: Payment }
          ]
        },
        { 
          model: Payment, 
          attributes: ['id', 'amountPaid', 'paymentDate', 'paymentMethod', 'receiptNo', 'status', 'enrollmentId'],
          include: [
            {
              model: Enrollment,
              attributes: ['id', 'courseId'],
              include: [
                { model: Course, as: 'Course', attributes: ['id', 'name', 'code'] }
              ]
            }
          ]
        }
      ]
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Calculate balance from payments
    const totalPaid = student.Payments?.reduce((sum, p) => sum + parseFloat(p.amountPaid || 0), 0) || 0;
    const studentTotalFee = student.Enrollments?.reduce((sum, e) => sum + parseFloat(e.totalFee || 0), 0) || (student.totalFee || 0);
    const studentDiscount = student.Enrollments?.reduce((sum, e) => sum + parseFloat(e.discount || 0), 0) || (student.discount || 0);
    const remainingBalance = studentTotalFee - studentDiscount - totalPaid;

    const studentData = student.toJSON();
    studentData.totalFee = studentTotalFee;
    studentData.discount = studentDiscount;
    studentData.totalPaid = totalPaid;
    studentData.paidAmount = totalPaid;
    studentData.payments = studentData.Payments || [];

    // Also fetch pending enrollment requests for this student
    const { EnrollmentRequest } = require('../models');
    const requests = await EnrollmentRequest.findAll({
      where: { studentId: parseInt(id) },
      include: [
        { 
          model: Course, 
          as: 'Course', 
          attributes: ['id', 'name', 'fee', 'code', 'duration', 'durationValue', 'durationUnit', 'offerInstallments', 'allowed_installments'],
          include: [
            { model: User, as: 'Instructors', attributes: ['id', 'name', 'email'] }
          ]
        }
      ]
    });

    const requestEnrollments = requests.map(r => ({
      id: `req_${r.id}`,
      isRequest: true,
      requestId: r.id,
      studentId: r.studentId,
      courseId: r.courseId,
      status: r.status,
      enrollmentDate: r.enrollmentDate,
      totalFee: r.totalFee,
      completionPercentage: 0,
      Course: r.Course,
      Batch: null,
      InstallmentSchedules: [],
      Payments: []
    }));

    const combinedEnrollments = [...(studentData.Enrollments || []), ...requestEnrollments];
    studentData.Enrollments = combinedEnrollments;

    res.json({ 
      student: studentData, 
      enrollments: combinedEnrollments,
      payments: studentData.Payments || [],
      summary: {
        totalFee: studentTotalFee,
        discount: studentDiscount,
        totalPaid,
        remainingBalance: Math.max(0, remainingBalance)
      }
    });
  } catch (error) {
    console.error('Get student by ID error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
};

// Create new student
const createStudent = async (req, res) => {
  try {
    console.log('📥 Admission request body:', req.body);

    const { userId, name, email, phone, cnic, address, courseId, batchId, discount = 0, totalInstallments = 2, commencementDate } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !courseId) {
      return res.status(400).json({
        error: 'Missing required fields',
        missing: {
          name: !name,
          email: !email,
          phone: !phone,
          courseId: !courseId
        }
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate phone format (Flexible international format)
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{7,}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      return res.status(400).json({ error: 'Invalid phone number format. Please use any international format (e.g., +1-555-123-4567 or 03-XXX-XXXXXX)' });
    }

    // Pull standardFee from Course model
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Validate course fee
    if (!course.fee || isNaN(course.fee) || course.fee <= 0) {
      return res.status(400).json({ 
        error: 'Invalid course fee configuration',
        details: 'Course fee must be a positive number greater than zero'
      });
    }

    // Validate batchId if provided
    let batch = null;
    if (batchId) {
      const batchIdValue = isNaN(batchId) ? batchId : parseInt(batchId);
      batch = await Batch.findByPk(batchIdValue);
      if (!batch) {
        return res.status(404).json({ error: 'Batch not found' });
      }
    }

    // Validate discount
    const discountAmount = Number(discount);
    if (isNaN(discountAmount) || discountAmount < 0) {
      return res.status(400).json({ error: 'Discount must be a valid non-negative number' });
    }
    if (discountAmount > course.fee) {
      return res.status(400).json({ error: 'Discount cannot be greater than course fee' });
    }

    // Calculate next_due_date based on commencement date
    let nextDueDate = null;
    let effectiveCommencementDate = commencementDate || new Date().toISOString().split('T')[0];
    if (effectiveCommencementDate) {
      const firstDueDate = new Date(effectiveCommencementDate);
      firstDueDate.setMonth(firstDueDate.getMonth() + 1);
      nextDueDate = firstDueDate.toISOString().split('T')[0];
    }

    let student = null;
    let user = null;

    if (userId) {
      // EXISTING STUDENT FLOW
      console.log(`🔍 Processing existing student with ID: ${userId}`);
      const cleanId = typeof userId === 'string' && userId.startsWith('student_') 
        ? parseInt(userId.replace('student_', ''), 10) 
        : parseInt(userId, 10);
      
      student = await Student.findByPk(cleanId);
      if (!student) {
        student = await Student.findOne({ where: { email } });
      }

      if (!student) {
        return res.status(404).json({ error: 'Existing student record not found' });
      }

      // Update student details with any modified details
      await student.update({
        name: name || student.name,
        email: email || student.email,
        phone: phone || student.phone,
        cnic: cnic !== undefined ? (cnic ? cnic.trim() : null) : student.cnic,
        address: address !== undefined ? (address ? address.trim() : null) : student.address,
        courseId: courseId,
        batchId: batchId ? (isNaN(batchId) ? batchId : parseInt(batchId)) : null,
        totalFee: course.fee,
        discount: discountAmount,
        totalInstallments: Number(totalInstallments),
        commencementDate: effectiveCommencementDate,
        next_due_date: nextDueDate
      });

      // Update corresponding User record if it exists
      user = await User.findOne({ where: { email: student.email } });
      if (user) {
        await user.update({
          name: name || user.name,
          email: email || user.email
        });
      }
    } else {
      // NEW STUDENT FLOW
      // Duplicate checks (only for new student)
      const existingByEmail = await Student.findOne({ where: { email } });
      if (existingByEmail) {
        return res.status(400).json({ error: 'Error: Email already registered.' });
      }
      const existingByPhone = await Student.findOne({ where: { phone } });
      if (existingByPhone) {
        return res.status(400).json({ error: 'Error: Phone already registered.' });
      }
      if (cnic && cnic.trim()) {
        const existingByCnic = await Student.findOne({ where: { cnic: cnic.trim() } });
        if (existingByCnic) {
          return res.status(400).json({ error: 'Error: CNIC already registered.' });
        }
      }

      // Generate a user account for login
      const userPassword = generateRandomPassword();
      const hashedPassword = await bcrypt.hash(userPassword, 10);
      user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: 'Student',
        status: 'Active'
      });

      // Send welcome email with credentials
      const welcomeHtml = getWelcomeTemplate(
          name,
          email,
          userPassword,
          course.name,
          batch ? batch.name : 'Unassigned'
      );

      // Generate initial registration PDF challan
      let welcomeAttachments = [];
      try {
          const setting = await Setting.findOne();
          const initialDue = parseFloat(course.fee || 0) - parseFloat(discountAmount || 0);
          const studentObj = {
              name,
              email,
              Course: course,
              Batch: batch
          };
          const challanBuffer = await generateChallanPDF(
              studentObj,
              initialDue,
              new Date(),
              setting
          );
          welcomeAttachments.push({
              filename: `Registration_Challan_${name.replace(/\s+/g, '_')}.pdf`,
              content: challanBuffer,
              contentType: 'application/pdf'
          });
      } catch (pdfErr) {
          console.error('Failed to generate initial welcome challan PDF:', pdfErr.message);
      }

      sendEmail(email, 'Welcome to Hunar Asaan Skills Center', welcomeHtml, welcomeAttachments)
        .catch(emailError => {
            console.warn('Failed to send welcome email:', emailError.message);
        });

      // Admin & Manager Alert Notification
      const registrationAlertSubject = `New Admission Registered: ${name}`;
      const registrationAlertHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
              <h2 style="color: #0f172a; border-bottom: 2px solid #0ea5e9; padding-bottom: 10px; margin-top: 0; font-size: 20px; font-weight: 800;">New Student Admission</h2>
              <p style="font-size: 14px; color: #475569; line-height: 1.6;">A new student has registered on the platform:</p>
              <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px;">
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                      <td style="padding: 10px 0; font-weight: bold; color: #475569; width: 100px;">Name:</td>
                      <td style="padding: 10px 0; color: #1e293b; font-weight: bold;">${name}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                      <td style="padding: 10px 0; font-weight: bold; color: #475569;">Email:</td>
                      <td style="padding: 10px 0; color: #1e293b;">${email}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                      <td style="padding: 10px 0; font-weight: bold; color: #475569;">Course:</td>
                      <td style="padding: 10px 0; color: #1e293b; font-weight: bold; color: #0ea5e9;">${course.name}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                      <td style="padding: 10px 0; font-weight: bold; color: #475569;">Batch:</td>
                      <td style="padding: 10px 0; color: #1e293b;">${batch ? batch.name : 'Unassigned'}</td>
                  </tr>
              </table>
              <div style="margin-top: 30px; text-align: center;">
                  <a href="https://ims.hunarasaan.com" style="background: #0f172a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; display: inline-block;">Access CRM Portal</a>
              </div>
          </div>
      `;
      sendAdminManagerNotification(registrationAlertSubject, registrationAlertHtml);

      // Create student record
      student = await Student.create({
        name,
        email,
        phone,
        cnic: cnic ? cnic.trim() : null,
        address: address ? address.trim() : null,
        courseId,
        batchId: batchId ? (isNaN(batchId) ? batchId : parseInt(batchId)) : null,
        totalFee: course.fee,
        discount: discountAmount,
        paidAmount: 0,
        totalPaid: 0,
        status: 'Active',
        totalInstallments: Number(totalInstallments),
        commencementDate: effectiveCommencementDate,
        next_due_date: nextDueDate,
        createdBy: req.user ? req.user.id : null
      });

      await logActivity(
        req.user ? req.user.id : null,
        'Student Registration',
        `Student "${name}" (${student.customId || `ID: ${student.id}`}) was registered by ${req.user ? req.user.name : 'System'}.`
      );
    }

    // Now inject enrollment & installments for the course
    const enrollment = await Enrollment.create({
      studentId: student.id,
      courseId: courseId,
      batchId: batchId ? (isNaN(batchId) ? batchId : parseInt(batchId)) : null,
      enrollmentDate: effectiveCommencementDate,
      status: 'Active',
      totalFee: course.fee,
      discount: discountAmount,
      installmentsAllowed: Number(totalInstallments) > 1,
      installmentMonths: Number(totalInstallments),
      monthlyAmount: (course.fee - discountAmount) / Number(totalInstallments)
    });

    const totalInstallmentsNum = Number(totalInstallments);
    if (totalInstallmentsNum > 0) {
      const schedules = [];
      const installments = [];
      const startDate = new Date(effectiveCommencementDate);
      const monthlyAmount = (course.fee - discountAmount) / totalInstallmentsNum;

      for (let i = 0; i < totalInstallmentsNum; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(startDate.getMonth() + i);
        const dueDateStr = dueDate.toISOString().split('T')[0];
        
        schedules.push({
          enrollmentId: enrollment.id,
          dueDate: dueDateStr,
          amount: monthlyAmount.toFixed(2),
          status: 'Pending'
        });

        installments.push({
          student_id: student.id,
          enrollment_id: enrollment.id,
          amount: monthlyAmount.toFixed(2),
          due_date: dueDateStr,
          status: 'PENDING'
        });
      }
      await InstallmentSchedule.bulkCreate(schedules);
      if (Installment) {
        await Installment.bulkCreate(installments);
      }
    }

    console.log(`✅ Student processed & Enrolled: ${student.name}, ID: ${student.id}`);

    res.status(201).json({
      success: true,
      student,
      enrollmentId: enrollment.id,
      message: userId 
        ? 'Existing student successfully enrolled in new course track' 
        : 'Student registered and enrolled successfully with installment schedule'
    });

  } catch (error) {
    console.error('❌ Create student error:', error);
    res.status(500).json({ 
      message: error.message || 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Update student
const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, cnic, address, courseId, batchId, discount, totalInstallments, status, customId } = req.body;

    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Update student record - only allow updating these specific fields
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (cnic !== undefined) updateData.cnic = cnic ? cnic.trim() : null;
    if (address !== undefined) updateData.address = address ? address.trim() : null;
    if (courseId !== undefined) updateData.courseId = courseId;
    if (batchId !== undefined) updateData.batchId = batchId;
    if (discount !== undefined) updateData.discount = Number(discount);
    if (totalInstallments !== undefined) updateData.totalInstallments = Number(totalInstallments);
    if (status !== undefined) updateData.status = status;
    if (customId !== undefined) updateData.customId = customId;

    await student.update(updateData);

    // Fetch updated student with associations
    const updatedStudent = await Student.findByPk(id, {
      include: [
        { model: Course, attributes: ['id', 'name', 'fee', 'code', 'duration'] },
        { model: Batch, attributes: ['id', 'name', 'time'] }
      ]
    });

    res.json({
      message: 'Student updated successfully',
      student: updatedStudent
    });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
};

// Delete student (with cascading deletion)
const deleteStudent = async (req, res) => {
  if (!req.user || req.user.role !== 'Admin') {
    return res.status(403).json({ error: 'You do not have permission to delete students' });
  }

  const { sequelize } = require('../models');
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;

    console.log(`🗑️ Attempting to delete student ID: ${id}`);

    const student = await Student.findByPk(id, { transaction });
    if (!student) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Student not found' });
    }

    const studentEmail = student.email;
    const studentName = student.name;

    console.log(`📋 Student to delete: ${studentName} (${studentEmail})`);

    // Step 1: Delete associated user account (by email)
    if (studentEmail) {
      const user = await User.findOne({ 
        where: { email: studentEmail },
        transaction 
      });
      if (user) {
        await user.destroy({ transaction });
        console.log(`✅ User account deleted: ${studentEmail}`);
      }
    }

    // Step 2: Delete all payments for this student (CASCADE is set in model, but explicit for clarity)
    const payments = await Payment.findAll({ 
      where: { studentId: id },
      transaction 
    });
    if (payments.length > 0) {
      await Payment.destroy({ 
        where: { studentId: id },
        transaction 
      });
      console.log(`✅ Deleted ${payments.length} payment records`);
    }

    // Step 3: Delete the student record
    await student.destroy({ transaction });
    console.log(`✅ Student record deleted: ${studentName}`);

    // Commit transaction
    await transaction.commit();

    await logActivity(
      req.user ? req.user.id : null,
      'Student Deletion',
      `Student "${studentName}" (Email: ${studentEmail || 'N/A'}) was deleted by ${req.user ? req.user.name : 'System'}.`
    );

    res.json({ 
      success: true,
      message: `Student "${studentName}" and all associated records have been permanently deleted.`,
      deletedStudent: {
        id: student.id,
        name: studentName,
        email: studentEmail,
        recordsDeleted: {
          userAccount: studentEmail ? 1 : 0,
          payments: payments.length
        }
      }
    });

  } catch (error) {
    // Rollback transaction on error
    await transaction.rollback();
    console.error('❌ Delete student error:', error);
    res.status(500).json({ 
      error: error.message || 'Server error during deletion',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  checkStudentExists
};