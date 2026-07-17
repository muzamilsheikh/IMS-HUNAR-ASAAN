const { DataTypes, Sequelize, Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

// Load .env only if not already loaded
if (!process.env.DB_NAME) {
    require('dotenv').config({ path: __dirname + '/../.env' });
}

// Create Sequelize instance
const sequelize = new Sequelize(
    process.env.DB_NAME || 'hunar_crm_db',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
        host: process.env.DB_HOST || '127.0.0.1',
        port: 3306,
        dialect: 'mysql',
        logging: false,
        dialectOptions: {
            connectTimeout: 60000,
            socketPath: process.env.DB_SOCKET || null
        },
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

// ============ USER MODEL ============
const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: { name: 'unique_email_constraint' } },
    password: { type: DataTypes.STRING(255), allowNull: false },
    role: { type: DataTypes.ENUM('Admin', 'admin', 'Manager', 'manager', 'accounts_manager', 'Ads Manager', 'Staff', 'Student'), defaultValue: 'Staff' },
    status: {
        type: DataTypes.ENUM('Active', 'Inactive'),
        allowNull: false,
        defaultValue: 'Active'
    },
    specialty: { type: DataTypes.STRING(255), allowNull: true },
    base_salary: { type: DataTypes.DECIMAL(10, 2), allowNull: true, defaultValue: 0 }
}, { timestamps: true, tableName: 'Users' });

// ============ COURSE MODEL ============
const Course = sequelize.define('Course', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    fee: { type: DataTypes.FLOAT, allowNull: false },
    duration: { type: DataTypes.STRING(100), allowNull: true },
    code: { type: DataTypes.STRING(50), allowNull: false, unique: { name: 'unique_code_constraint' } },
    durationValue: { type: DataTypes.INTEGER, allowNull: true },
    durationUnit: { type: DataTypes.ENUM('Months', 'Weeks'), allowNull: true, defaultValue: 'Months' },
    classesPerWeek: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 2 },
    totalClasses: { type: DataTypes.INTEGER, allowNull: true },
    offerInstallments: { type: DataTypes.BOOLEAN, defaultValue: false },
    allowed_installments: { type: DataTypes.INTEGER, allowNull: true }
}, { timestamps: true, tableName: 'Courses' });

// ============ BATCH MODEL ============
const Batch = sequelize.define('Batch', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    time: { type: DataTypes.STRING(100), allowNull: true },
    meetingLink: { type: DataTypes.STRING(500), allowNull: true },
    driveLink: { type: DataTypes.STRING(500), allowNull: true },
    courseId: { type: DataTypes.INTEGER, allowNull: true },
    // 🔥 NEW Columns for Recurrent Scheduling:
    startDate: { type: DataTypes.DATEONLY, allowNull: true },
    scheduleDays: { type: DataTypes.STRING(500), allowNull: true }, // e.g. "Monday,Wednesday"
    startTime: { type: DataTypes.STRING(50), allowNull: true },
    endTime: { type: DataTypes.STRING(50), allowNull: true }
}, { 
    timestamps: true, 
    tableName: 'Batches',
    indexes: [
        { fields: ['courseId'] }
    ]
});

// ============ STUDENT MODEL ============
const Student = sequelize.define('Student', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    customId: { type: DataTypes.STRING(50), allowNull: true }, // Custom student ID like MBC-2024-001
    name: { type: DataTypes.STRING(255), allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: true },   // Uniqueness enforced at controller level
    phone: { type: DataTypes.STRING(20), allowNull: true },    // Uniqueness enforced at controller level
    cnic: { type: DataTypes.STRING(20), allowNull: true },     // Uniqueness enforced at controller level
    address: { type: DataTypes.TEXT, allowNull: true },
    totalFee: { type: DataTypes.DECIMAL(10, 2), allowNull: true, defaultValue: 0 },
    paidAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    totalPaid: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    discount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    totalInstallments: { type: DataTypes.INTEGER, defaultValue: 2 },
    status: { 
        type: DataTypes.ENUM('Active', 'Settled', 'Dropped', 'Passout', 'Completed'), 
        defaultValue: 'Active',
        comment: 'Active=System Active, Settled=Fully Settled, Dropped=Dropped/Dormant, Passout=Passout/Certified'
    },
    courseId: { type: DataTypes.INTEGER, allowNull: true },
    batchId: { type: DataTypes.INTEGER, allowNull: true },
    createdBy: { type: DataTypes.INTEGER, allowNull: true },
    // Monthly billing fields
    commencementDate: { type: DataTypes.DATEONLY, allowNull: true },
    next_due_date: { type: DataTypes.DATEONLY, allowNull: true }
}, { 
    timestamps: true, 
    tableName: 'Students',
    indexes: [
        { fields: ['courseId'] },
        { fields: ['batchId'] }
    ]
});

// ============ EXPENSE MODEL ============
const Expense = sequelize.define('Expense', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    description: { type: DataTypes.STRING(500), allowNull: false },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    category: {
        type: DataTypes.ENUM('Marketing', 'Utilities', 'Rent', 'Salaries', 'Maintenance', 'Other'),
        defaultValue: 'Other'
    },
    date: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW }
}, { timestamps: true, tableName: 'Expenses' });

// ============ SETTING MODEL ============
const Setting = sequelize.define('Setting', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    instituteName: { type: DataTypes.STRING(255), allowNull: true, defaultValue: 'Hunar Asaan' },
    contact: { type: DataTypes.STRING(100), allowNull: true },
    address: { type: DataTypes.TEXT, allowNull: true },
    logoUrl: { type: DataTypes.STRING(500), allowNull: true },
    emailHost: { type: DataTypes.STRING(255), allowNull: true },
    emailPort: { type: DataTypes.STRING(10), allowNull: true, defaultValue: '587' },
    emailUser: { type: DataTypes.STRING(255), allowNull: true },
    emailPass: { type: DataTypes.STRING(255), allowNull: true },
    bankName: { type: DataTypes.STRING(255), allowNull: true },
    accountTitle: { type: DataTypes.STRING(255), allowNull: true },
    accountNo: { type: DataTypes.STRING(100), allowNull: true },
    ibanCode: { type: DataTypes.STRING(100), allowNull: true },
    paymentInstructions: { type: DataTypes.TEXT, allowNull: true }
}, { timestamps: true, tableName: 'Settings' });

// ============ LIVE CLASSES MODEL ============
const LiveClass = sequelize.define('LiveClass', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    batchId: { type: DataTypes.INTEGER, allowNull: false },
    classLink: { type: DataTypes.STRING(500), allowNull: true },
    topic: { type: DataTypes.STRING(255), allowNull: false },
    startTime: { type: DataTypes.DATE, allowNull: true },
    updateNote: { type: DataTypes.TEXT, allowNull: true, defaultValue: '' }
}, { 
    timestamps: true, 
    tableName: 'LiveClasses',
    indexes: [
        { fields: ['batchId'] }
    ]
});

// ============ SCHEDULE MODEL ============
const Schedule = sequelize.define('Schedule', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    batchId: { type: DataTypes.INTEGER, allowNull: false },
    topic: { type: DataTypes.STRING(255), allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    startTime: { type: DataTypes.STRING(50), allowNull: false },
    endTime: { type: DataTypes.STRING(50), allowNull: false },
    status: { type: DataTypes.ENUM('Scheduled', 'Completed', 'Cancelled'), defaultValue: 'Scheduled' }
}, {
    timestamps: true,
    tableName: 'Schedules',
    indexes: [
        { fields: ['batchId'] }
    ]
});

// ============ CHAT GROUPS MODEL ============
const ChatGroup = sequelize.define('ChatGroup', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    groupName: { type: DataTypes.STRING(255), allowNull: false },
    batchId: { type: DataTypes.INTEGER, allowNull: true },
    type: { type: DataTypes.ENUM('batch', 'direct'), defaultValue: 'batch' }  // batch group or direct message
}, { timestamps: true, tableName: 'ChatGroups' });

// ============ CHAT MESSAGES MODEL ============
const ChatMessage = sequelize.define('ChatMessage', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    senderId: { type: DataTypes.INTEGER, allowNull: false },
    receiverId: { type: DataTypes.INTEGER, allowNull: true },  // for direct messages
    groupId: { type: DataTypes.INTEGER, allowNull: true },     // for group messages
    message: { type: DataTypes.TEXT, allowNull: false },
    messageType: { type: DataTypes.ENUM('text', 'image', 'file'), defaultValue: 'text' },
    readStatus: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { timestamps: true, tableName: 'ChatMessages' });

// ============ PAYMENT MODEL ============
const Payment = sequelize.define('Payment', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    studentId: { type: DataTypes.INTEGER, allowNull: false },
    amountPaid: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    paymentDate: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    paymentMethod: { type: DataTypes.ENUM('Cash', 'Online', 'Bank'), allowNull: false },
    transactionId: { type: DataTypes.STRING(100), allowNull: true },
    receiptNo: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    remainingBalance: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    status: { type: DataTypes.ENUM('Pending', 'Paid'), defaultValue: 'Paid' },
    enrollmentId: { type: DataTypes.INTEGER, allowNull: true },
    installmentNo: { type: DataTypes.INTEGER, allowNull: true },
    discount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    slipUrl: { type: DataTypes.STRING(255), allowNull: true }
}, { 
    timestamps: true, 
    tableName: 'Payments',
    indexes: [
        { fields: ['studentId'] },
        { fields: ['enrollmentId'] }
    ]
});

// ============ ENROLLMENT MODEL (M:N join table) ============
const Enrollment = sequelize.define('Enrollment', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    studentId: { type: DataTypes.INTEGER, allowNull: false },
    courseId: { type: DataTypes.INTEGER, allowNull: true },
    batchId: { type: DataTypes.INTEGER, allowNull: true },
    enrollmentDate: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
    status: {
        type: DataTypes.ENUM('Active', 'Completed', 'Dropped'),
        defaultValue: 'Active'
    },
    completionPercentage: { type: DataTypes.INTEGER, defaultValue: 0 },
    notes: { type: DataTypes.TEXT, allowNull: true },
    // 🔥 NEW: Financial Fields
    totalFee: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    discount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    installmentsAllowed: { type: DataTypes.BOOLEAN, defaultValue: false },
    downPayment: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    installmentMonths: { type: DataTypes.INTEGER, defaultValue: 1 },
    monthlyAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 }
}, { 
    timestamps: true, 
    tableName: 'Enrollments',
    indexes: [
        { fields: ['studentId'] },
        { fields: ['courseId'] },
        { fields: ['batchId'] }
    ]
});

// ============ INSTALLMENT SCHEDULE MODEL ============
const InstallmentSchedule = sequelize.define('InstallmentSchedule', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    enrollmentId: { type: DataTypes.INTEGER, allowNull: false },
    dueDate: { type: DataTypes.DATEONLY, allowNull: false },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    status: { type: DataTypes.ENUM('Pending', 'Paid'), defaultValue: 'Pending' }
}, { 
    timestamps: true, 
    tableName: 'InstallmentSchedules',
    indexes: [
        { fields: ['enrollmentId'] }
    ]
});

// ============ INSTALLMENT MODEL (student-level installment tracking) ============
// Separate from InstallmentSchedule — this model is used by the Installment
// Overdue Checker cron job and the student ledger endpoint.
const Installment = sequelize.define('Installment', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    student_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Students', key: 'id' },
        onDelete: 'CASCADE'
    },
    enrollment_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Enrollments', key: 'id' },
        onDelete: 'CASCADE'
    },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    due_date: { type: DataTypes.DATEONLY, allowNull: false },
    paid_date: { type: DataTypes.DATEONLY, allowNull: true, defaultValue: null },
    status: {
        type: DataTypes.ENUM('PENDING', 'PAID', 'OVERDUE'),
        defaultValue: 'PENDING',
        allowNull: false
    }
}, {
    timestamps: true,
    tableName: 'Installments',
    indexes: [
        { fields: ['student_id'] },
        { fields: ['enrollment_id'] },
        { fields: ['status', 'due_date'] }
    ]
});

// ============ VIDEO RECORDING MODEL ============
const VideoRecording = sequelize.define('VideoRecording', {
    id: { 
        type: DataTypes.UUID, 
        defaultValue: () => uuidv4(), 
        primaryKey: true 
    },
    courseId: { type: DataTypes.INTEGER, allowNull: false },
    batchId: { type: DataTypes.INTEGER, allowNull: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    googleDriveFileId: { type: DataTypes.STRING(255), allowNull: false },
    duration: { type: DataTypes.STRING(50), allowNull: true },
    fileSize: { type: DataTypes.BIGINT, allowNull: true },
    mimeType: { type: DataTypes.STRING(100), allowNull: true, defaultValue: 'video/mp4' },
    thumbnailUrl: { type: DataTypes.STRING(500), allowNull: true },
    isApproved: { type: DataTypes.BOOLEAN, defaultValue: false },
    uploadedBy: { type: DataTypes.INTEGER, allowNull: true },
    viewCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    status: { 
        type: DataTypes.ENUM('Active', 'Archived', 'Deleted'), 
        defaultValue: 'Active' 
    }
}, { timestamps: true, tableName: 'VideoRecordings' });

// ============ VIDEO ACCESS REQUEST MODEL ============
const VideoAccessRequest = sequelize.define('VideoAccessRequest', {
    id: { 
        type: DataTypes.UUID, 
        defaultValue: () => uuidv4(), 
        primaryKey: true 
    },
    studentId: { type: DataTypes.INTEGER, allowNull: false },
    recordingId: { type: DataTypes.UUID, allowNull: false },
    status: { 
        type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'), 
        defaultValue: 'Pending' 
    },
    approvedBy: { type: DataTypes.INTEGER, allowNull: true },
    approvedAt: { type: DataTypes.DATE, allowNull: true },
    rejectionReason: { type: DataTypes.TEXT, allowNull: true }
}, { timestamps: true, tableName: 'VideoAccessRequests' });

// ============ VIDEO VIEW LOG MODEL ============
const VideoViewLog = sequelize.define('VideoViewLog', {
    id: { 
        type: DataTypes.UUID, 
        defaultValue: () => uuidv4(), 
        primaryKey: true 
    },
    studentId: { type: DataTypes.INTEGER, allowNull: false },
    recordingId: { type: DataTypes.UUID, allowNull: false },
    ipAddress: { type: DataTypes.STRING(50), allowNull: false },
    userAgent: { type: DataTypes.TEXT, allowNull: false },
    browserInfo: { type: DataTypes.STRING(255), allowNull: true },
    osInfo: { type: DataTypes.STRING(255), allowNull: true },
    deviceInfo: { type: DataTypes.STRING(255), allowNull: true },
    sessionStartedAt: { type: DataTypes.DATE, allowNull: false },
    sessionEndedAt: { type: DataTypes.DATE, allowNull: true },
    watchDuration: { type: DataTypes.INTEGER, defaultValue: 0 }, // in seconds
    isSuspicious: { type: DataTypes.BOOLEAN, defaultValue: false },
    suspiciousReason: { type: DataTypes.TEXT, allowNull: true }
}, { timestamps: true, tableName: 'VideoViewLogs' });

// ============ VIDEO SESSION MODEL (IP Binding) ============
const VideoSession = sequelize.define('VideoSession', {
    id: { 
        type: DataTypes.UUID, 
        defaultValue: () => uuidv4(), 
        primaryKey: true 
    },
    studentId: { type: DataTypes.INTEGER, allowNull: false },
    recordingId: { type: DataTypes.UUID, allowNull: false },
    ipAddress: { type: DataTypes.STRING(50), allowNull: false },
    sessionToken: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    lastPingAt: { type: DataTypes.DATE, allowNull: true }
}, { timestamps: true, tableName: 'VideoSessions' });

// ============ ENROLLMENT REQUEST MODEL ============
const EnrollmentRequest = sequelize.define('EnrollmentRequest', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    studentId: { type: DataTypes.INTEGER, allowNull: false },
    courseId: { type: DataTypes.INTEGER, allowNull: false },
    status: {
        type: DataTypes.ENUM('Pending', 'Approved', 'Declined'),
        defaultValue: 'Pending'
    },
    totalFee: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    enrollmentDate: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW }
}, { 
    timestamps: true, 
    tableName: 'EnrollmentRequests',
    indexes: [
        { fields: ['studentId'] },
        { fields: ['courseId'] }
    ]
});

// ============ COURSE INSTRUCTOR JUNCTION MODEL ============
const CourseInstructor = sequelize.define('CourseInstructor', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    courseId: { type: DataTypes.INTEGER, allowNull: false }
}, { tableName: 'CourseInstructors', timestamps: true });

// ============ SALARY PAYMENT MODEL ============
// Fields use snake_case to match the paymentController and cronJobs expectations.
// sequelize.sync({ alter: true }) will migrate the existing SalaryPayments table.
const SalaryPayment = sequelize.define('SalaryPayment', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    staff_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'staff_id'
    },
    month_year: {
        type: DataTypes.STRING(7),
        allowNull: false,
        field: 'month_year',
        comment: 'MM-YYYY format'
    },
    base_pay: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: 'base_pay'
    },
    status: {
        type: DataTypes.ENUM('PAID', 'PENDING'),
        defaultValue: 'PENDING',
        allowNull: false
    },
    disbursal_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        defaultValue: null,
        field: 'disbursal_date'
    }
}, {
    tableName: 'SalaryPayments',
    timestamps: true,
    indexes: [
        { unique: true, fields: ['staff_id', 'month_year'], name: 'unique_staff_month_salary' }
    ]
});

// ============ ACTIVITY LOG MODEL ============
const ActivityLog = sequelize.define('ActivityLog', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: true },
    action: { type: DataTypes.STRING(255), allowNull: false },
    details: { type: DataTypes.TEXT, allowNull: true }
}, { timestamps: true, tableName: 'ActivityLogs' });

// ============ ASSOCIATIONS ============
// Keep only essential associations to avoid MySQL key limit
Course.hasMany(Batch, { foreignKey: 'courseId', onDelete: 'SET NULL' });
Batch.belongsTo(Course, { foreignKey: 'courseId' });

// Many-to-Many: User <-> Course
User.belongsToMany(Course, { through: CourseInstructor, foreignKey: 'userId', as: 'Courses', onDelete: 'CASCADE' });
Course.belongsToMany(User, { through: CourseInstructor, foreignKey: 'courseId', as: 'Instructors', onDelete: 'CASCADE' });

// One-to-Many: User -> SalaryPayment
User.hasMany(SalaryPayment, { foreignKey: 'staff_id', as: 'SalaryPayments', onDelete: 'CASCADE' });
SalaryPayment.belongsTo(User, { foreignKey: 'staff_id', as: 'staff' });

Course.hasMany(Student, { foreignKey: 'courseId', onDelete: 'SET NULL' });
Student.belongsTo(Course, { foreignKey: 'courseId' });

// ============ M:N ENROLLMENT ASSOCIATIONS ============
Student.belongsToMany(Course, { through: Enrollment, foreignKey: 'studentId', otherKey: 'courseId', as: 'EnrolledCourses' });
Course.belongsToMany(Student, { through: Enrollment, foreignKey: 'courseId', otherKey: 'studentId', as: 'EnrolledStudents' });
Student.hasMany(Enrollment, { foreignKey: 'studentId', as: 'Enrollments', onDelete: 'CASCADE' });
Enrollment.belongsTo(Student, { foreignKey: 'studentId' });
Enrollment.belongsTo(Course, { foreignKey: 'courseId', as: 'Course', onDelete: 'SET NULL' });
Enrollment.belongsTo(Batch, { foreignKey: 'batchId', as: 'Batch', onDelete: 'SET NULL' });


// Payment associations
Student.hasMany(Payment, { foreignKey: 'studentId', onDelete: 'CASCADE' });
Payment.belongsTo(Student, { foreignKey: 'studentId' });
Batch.hasMany(Student, { foreignKey: 'batchId', onDelete: 'SET NULL' });
Student.belongsTo(Batch, { foreignKey: 'batchId' });

// Live Class associations
Batch.hasMany(LiveClass, { foreignKey: 'batchId', onDelete: 'CASCADE' });
LiveClass.belongsTo(Batch, { foreignKey: 'batchId' });

// Schedule associations
Batch.hasMany(Schedule, { foreignKey: 'batchId', onDelete: 'CASCADE' });
Schedule.belongsTo(Batch, { foreignKey: 'batchId' });

// Chat associations - Minimal to avoid key limits
User.hasMany(ChatMessage, { foreignKey: 'senderId', onDelete: 'CASCADE' });
ChatMessage.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

ChatGroup.hasMany(ChatMessage, { foreignKey: 'groupId', onDelete: 'CASCADE' });
ChatMessage.belongsTo(ChatGroup, { foreignKey: 'groupId', as: 'ChatGroup' });

// Batch to ChatGroup association
Batch.hasMany(ChatGroup, { foreignKey: 'batchId', onDelete: 'SET NULL' });
ChatGroup.belongsTo(Batch, { foreignKey: 'batchId' });

Enrollment.hasMany(Payment, { foreignKey: 'enrollmentId', onDelete: 'CASCADE' });
Payment.belongsTo(Enrollment, { foreignKey: 'enrollmentId' });

Enrollment.hasMany(InstallmentSchedule, { foreignKey: 'enrollmentId', as: 'InstallmentSchedules', onDelete: 'CASCADE' });
InstallmentSchedule.belongsTo(Enrollment, { foreignKey: 'enrollmentId' });

// Video Recording associations
Course.hasMany(VideoRecording, { foreignKey: 'courseId', onDelete: 'CASCADE' });
VideoRecording.belongsTo(Course, { foreignKey: 'courseId' });
Batch.hasMany(VideoRecording, { foreignKey: 'batchId', onDelete: 'SET NULL' });
VideoRecording.belongsTo(Batch, { foreignKey: 'batchId' });
User.hasMany(VideoRecording, { foreignKey: 'uploadedBy', onDelete: 'SET NULL' });
VideoRecording.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });

// Installment associations
Student.hasMany(Installment, { foreignKey: 'student_id', as: 'Installments', onDelete: 'CASCADE' });
Installment.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });
Enrollment.hasMany(Installment, { foreignKey: 'enrollment_id', as: 'Installments', onDelete: 'CASCADE' });
Installment.belongsTo(Enrollment, { foreignKey: 'enrollment_id', as: 'enrollment' });

// Video Access Request associations
Student.hasMany(VideoAccessRequest, { foreignKey: 'studentId', onDelete: 'CASCADE' });
VideoAccessRequest.belongsTo(Student, { foreignKey: 'studentId' });
VideoRecording.hasMany(VideoAccessRequest, { foreignKey: 'recordingId', onDelete: 'CASCADE' });
VideoAccessRequest.belongsTo(VideoRecording, { foreignKey: 'recordingId' });
User.hasMany(VideoAccessRequest, { foreignKey: 'approvedBy', onDelete: 'SET NULL' });
VideoAccessRequest.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });

// Video View Log associations
Student.hasMany(VideoViewLog, { foreignKey: 'studentId', onDelete: 'CASCADE' });
VideoViewLog.belongsTo(Student, { foreignKey: 'studentId' });
VideoRecording.hasMany(VideoViewLog, { foreignKey: 'recordingId', onDelete: 'CASCADE' });
VideoViewLog.belongsTo(VideoRecording, { foreignKey: 'recordingId' });

// Video Session associations
Student.hasMany(VideoSession, { foreignKey: 'studentId', onDelete: 'CASCADE' });
VideoSession.belongsTo(Student, { foreignKey: 'studentId' });
VideoRecording.hasMany(VideoSession, { foreignKey: 'recordingId', onDelete: 'CASCADE' });
VideoSession.belongsTo(VideoRecording, { foreignKey: 'recordingId' });

// EnrollmentRequest associations
Student.hasMany(EnrollmentRequest, { foreignKey: 'studentId', onDelete: 'CASCADE' });
EnrollmentRequest.belongsTo(Student, { foreignKey: 'studentId' });
Course.hasMany(EnrollmentRequest, { foreignKey: 'courseId', onDelete: 'CASCADE' });
EnrollmentRequest.belongsTo(Course, { foreignKey: 'courseId' });

// Student creator association
Student.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(Student, { foreignKey: 'createdBy', as: 'CreatedStudents' });

// Activity log association
User.hasMany(ActivityLog, { foreignKey: 'userId', onDelete: 'SET NULL' });
ActivityLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// ============ EXPORTS ============
module.exports = {
    sequelize,
    User,
    Course,
    Batch,
    Student,
    Enrollment,
    InstallmentSchedule,
    Installment,
    Expense,
    Setting,
    LiveClass,
    Schedule,
    ChatGroup,
    ChatMessage,
    Payment,
    VideoRecording,
    VideoAccessRequest,
    VideoViewLog,
    VideoSession,
    EnrollmentRequest,
    CourseInstructor,
    SalaryPayment,
    ActivityLog,
    Op
};

// NOTE: DB sync and admin seeding is handled exclusively by server/index.js → initializeDatabase().
// The IIFE that used to be here caused a double sync on every require(), which was a major
// performance bottleneck. Do NOT add a self-executing sync here.
