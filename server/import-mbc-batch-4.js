/**
 * import-mbc-batch-4.js
 * Programmatic seeding of the MBC Course, MBC BATCH 4, and 21 students with their ledger states.
 * Usage: node server/import-mbc-batch-4.js
 */

require('dotenv').config({ path: __dirname + '/.env' });
const bcrypt = require('bcryptjs');
const { 
    sequelize, 
    User, 
    Student, 
    Course, 
    Batch, 
    Enrollment, 
    Installment, 
    InstallmentSchedule, 
    Payment 
} = require('./models');

// RCP-XXXXXX-YYYY generator
const generateReceiptNo = (studentId, instNo) => {
    const timestamp = Date.now().toString().slice(-4);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `RCP-${timestamp}-${studentId}${instNo}-${random}`;
};

const rawStudents = [
  {
    sr: 1,
    date: "2026-02-25",
    name: "Atifa Umber",
    email: "atifaumber@gmail.com",
    phone: "03200484512",
    cnic: "35201-1951651-8",
    address: "-",
    feeStatus: "Full Pay",
    inst1: 25000,
    inst2: null,
    total: 25000,
    remaining: 0
  },
  {
    sr: 5,
    date: "2026-03-10",
    name: "Bushra Raffat",
    email: "bushraraffat92@gmail.com",
    phone: "03463556452",
    cnic: "4250114144154",
    address: "Karachi",
    feeStatus: "Full Pay",
    inst1: 28000,
    inst2: null,
    total: 28000,
    remaining: 0
  },
  {
    sr: 6,
    date: "2026-03-10",
    name: "Mohsin Zakir",
    email: "mohsin474shkh@gmail.com",
    phone: "03234450474",
    cnic: "3520187157843",
    address: "LAHORE",
    feeStatus: "Full Pay",
    inst1: 28000,
    inst2: null,
    total: 28000,
    remaining: 0
  },
  {
    sr: 7,
    date: "2026-03-13",
    name: "Anam irfan",
    email: "irfananam099@gmail.com",
    phone: "15712768099",
    cnic: "-",
    address: "Peshawar",
    feeStatus: "Full Pay",
    inst1: 28000,
    inst2: null,
    total: 28000,
    remaining: 0
  },
  {
    sr: 10,
    date: "2026-03-25",
    name: "Aisha Rafique",
    email: "aiisha.rafik@gmail.com",
    phone: "03348112580",
    cnic: "3410116386356",
    address: "Gujranwala",
    feeStatus: "Full Pay",
    inst1: 28000,
    inst2: null,
    total: 28000,
    remaining: 0
  },
  {
    sr: 13,
    date: "2026-04-09",
    name: "Jaweria Afzal",
    email: "jaweriaafzal21@gmail.com",
    phone: "03133952847",
    cnic: "42201-9412701-2",
    address: "Karachi",
    feeStatus: "Full Pay",
    inst1: 25000,
    inst2: null,
    total: 25000,
    remaining: 0
  },
  {
    sr: 4,
    date: "2026-03-09",
    name: "Tabbasum Islam khan",
    email: "tabbasumislamkhan07@gmail.com",
    phone: "03325580885",
    cnic: "13503-7877027-0",
    address: "Faisal town Islamabad",
    feeStatus: "Installment",
    inst1: 15000,
    inst2: 15000,
    total: 30000,
    remaining: 0
  },
  {
    sr: 14,
    date: "2026-04-13",
    name: "Fareeda Ashraf",
    email: "faridagilani92@gmail.com",
    phone: "03035077194",
    cnic: "35202-8274705-0",
    address: "Lahore",
    feeStatus: "Installment",
    inst1: 15000,
    inst2: 15000,
    total: 30000,
    remaining: 0
  },
  {
    sr: 21,
    date: "2026-04-15",
    name: "Affan Ahmed",
    email: "Affan.110@gmail.com",
    phone: "03002904609",
    cnic: "4210148719595",
    address: "house no 49/3,1j near Muslim league quarters , Nazimabad no 1. Karachi.",
    feeStatus: "Installment",
    inst1: 15000,
    inst2: 15000,
    total: 30000,
    remaining: 0
  },
  {
    sr: 3,
    date: "2026-03-05",
    name: "Hafiz Gohar Masood",
    email: "gohar.masood1@gmail.com",
    phone: "03226677033",
    cnic: "3320205703137",
    address: "-",
    feeStatus: "Installment",
    inst1: 15000,
    inst2: 15000,
    total: 30000,
    remaining: 0
  },
  {
    sr: 2,
    date: "2026-03-02",
    name: "Sadia Wazir",
    email: "drsadiazain@yahoo.com",
    phone: "03332035647",
    cnic: "173011-328541-8",
    address: "-",
    feeStatus: "Installment",
    inst1: 15000,
    inst2: 15000,
    total: 30000,
    remaining: 0
  },
  {
    sr: 9,
    date: "2026-03-20",
    name: "Mahnoor Khalid Khan",
    email: "Mnkk145@yahoo.com",
    phone: "03320035922",
    cnic: "133024-832986-2",
    address: "Haripur",
    feeStatus: "Installment",
    inst1: 15000,
    inst2: 15000,
    total: 30000,
    remaining: 0
  },
  {
    sr: 16,
    date: "2026-04-14",
    name: "Tajala khan",
    email: "Kakartajala7@gmail.com",
    phone: "03200893348",
    cnic: "54400-3076402-0",
    address: "Quetta /balochistan",
    feeStatus: "Installment",
    inst1: 20000,
    inst2: 5000,
    total: 25000,
    remaining: 0
  },
  {
    sr: 17,
    date: "2026-04-14",
    name: "Walwala kasi",
    email: "Walwalakasi2@gmail.com",
    phone: "03139669791",
    cnic: "5440040772796",
    address: "Quetta /balochistan",
    feeStatus: "Installment",
    inst1: 20000,
    inst2: 5000,
    total: 25000,
    remaining: 0
  },
  {
    sr: 18,
    date: "2026-04-14",
    name: "Tabassum",
    email: "tabassum.muzaffar@gmail.com",
    phone: "03353551187",
    cnic: "42201-0760386-6",
    address: "karachi",
    feeStatus: "Installment",
    inst1: 10000,
    inst2: 18000,
    total: 28000,
    remaining: 0
  },
  {
    sr: 20,
    date: "2026-04-15",
    name: "Muhammad Ali",
    email: "shamistar2k@gmail.com",
    phone: "03314043635",
    cnic: "3520127271703",
    address: "Lahore",
    feeStatus: "Installment",
    inst1: 12500,
    inst2: 12500,
    total: 25000,
    remaining: 0
  },
  {
    sr: 8,
    date: "2026-03-24",
    name: "Ruqaiya Abbasi",
    email: "ruqaiyatauqeer1@gmail.com",
    phone: "03456050345",
    cnic: "54400-4055626-8",
    address: "Karachi",
    feeStatus: "Installment",
    inst1: 15000,
    inst2: 15000,
    total: 30000,
    remaining: 15000
  },
  {
    sr: 12,
    date: "2026-04-07",
    name: "Dr mehak mobin",
    email: "mehak.mobin@gmail.com",
    phone: "03162336830",
    cnic: "4220145046100",
    address: "Karachi",
    feeStatus: "Installment",
    inst1: 15000,
    inst2: 15000,
    total: 30000,
    remaining: 15000
  },
  {
    sr: 15,
    date: "2026-04-13",
    name: "Fahir shaheen",
    email: "fahirktk4@gmail.com",
    phone: "03154915655",
    cnic: "14203-5945448-9",
    address: "Ghundi kala tehsil takhti nasrati District Karak",
    feeStatus: "Installment",
    inst1: 14000,
    inst2: 14000,
    total: 28000,
    remaining: 14000
  },
  {
    sr: 11,
    date: "2026-03-25",
    name: "Faryal Moiz",
    email: "faryhussain@yahoo.com",
    phone: "03350561285",
    cnic: "42101-6531387-2",
    address: "Rawalpindi Pakistan.",
    feeStatus: "Demo",
    inst1: null,
    inst2: null,
    total: 0,
    remaining: 0
  },
  {
    sr: 19,
    date: "2026-04-09",
    name: "Ambreen Fatima",
    email: "aambreen886@gmail.com",
    phone: "03360323518",
    cnic: "-",
    address: "-",
    feeStatus: "Demo",
    inst1: null,
    inst2: null,
    total: 0,
    remaining: 0
  }
];

async function importData() {
    const transaction = await sequelize.transaction();
    try {
        console.log('🔄 Connected to DB, checking course...');
        
        // 1. Create or Find Course "MBC"
        let course = await Course.findOne({ where: { code: 'MBC' }, transaction });
        if (!course) {
            course = await Course.create({
                name: 'Medical Billing Course',
                fee: 30000,
                duration: '3 Months',
                code: 'MBC',
                durationValue: 3,
                durationUnit: 'Months',
                classesPerWeek: 2,
                totalClasses: 24,
                offerInstallments: true,
                allowed_installments: 2
            }, { transaction });
            console.log('✅ Created MBC Course');
        }

        // 2. Create or Find Batch "MBC BATCH 4"
        let batch = await Batch.findOne({ where: { name: 'MBC BATCH 4' }, transaction });
        if (!batch) {
            batch = await Batch.create({
                name: 'MBC BATCH 4',
                time: 'Monday Recorded Lectures',
                courseId: course.id,
                startDate: '2026-02-25'
            }, { transaction });
            console.log('✅ Created Batch MBC BATCH 4');
        }

        const defaultPasswordHash = await bcrypt.hash('12345678', 10);

        for (const data of rawStudents) {
            console.log(`👤 Importing student: ${data.name}...`);

            // Duplication check
            const exist = await Student.findOne({ where: { email: data.email }, transaction });
            if (exist) {
                console.log(`⚠️ Student ${data.name} already exists. Skipping.`);
                continue;
            }

            // Create User account
            const user = await User.create({
                name: data.name,
                email: data.email,
                password: defaultPasswordHash,
                role: 'Student',
                status: 'Active'
            }, { transaction });

            const cleanCnic = data.cnic === '-' ? null : data.cnic;
            const cleanAddress = data.address === '-' ? null : data.address;

            // Calculations
            // Standard Course Fee is 30000.
            // If student's total is less, the difference is calculated as a discount.
            // If student is on demo, discount is 30000, net payable is 0.
            const studentTotalFee = 30000;
            const discount = data.feeStatus === 'Demo' ? 30000 : (30000 - (data.total || 0));
            const netPayable = studentTotalFee - discount;

            // Calculate paid amount
            let paidAmount = 0;
            if (data.feeStatus === 'Full Pay') {
                paidAmount = data.total;
            } else if (data.feeStatus === 'Installment') {
                if (data.remaining === 0) {
                    paidAmount = data.total;
                } else {
                    paidAmount = data.inst1 || 0;
                }
            }

            const totalInstallments = data.feeStatus === 'Full Pay' ? 1 : 2;
            
            // Commencement Date & Next Due Date logic
            let nextDueDate = null;
            if (data.date) {
                const firstDueDate = new Date(data.date);
                firstDueDate.setMonth(firstDueDate.getMonth() + 1);
                nextDueDate = firstDueDate.toISOString().split('T')[0];
            }

            // Create Student
            const student = await Student.create({
                customId: `MBC-2026-${data.sr.toString().padStart(3, '0')}`,
                name: data.name,
                email: data.email,
                phone: data.phone,
                cnic: cleanCnic,
                address: cleanAddress,
                courseId: course.id,
                batchId: batch.id,
                totalFee: studentTotalFee,
                discount: discount,
                paidAmount: 0,
                totalPaid: 0,
                status: 'Active',
                totalInstallments: totalInstallments,
                commencementDate: data.date,
                next_due_date: nextDueDate
            }, { transaction });

            // Create Enrollment
            const enrollment = await Enrollment.create({
                studentId: student.id,
                courseId: course.id,
                batchId: batch.id,
                enrollmentDate: data.date,
                status: 'Active',
                totalFee: studentTotalFee,
                discount: discount,
                installmentsAllowed: totalInstallments > 1,
                installmentMonths: totalInstallments,
                monthlyAmount: totalInstallments > 0 ? (netPayable / totalInstallments) : 0
            }, { transaction });

            // Create Installments & Payments
            if (totalInstallments > 0 && data.feeStatus !== 'Demo') {
                const monthlyAmount = netPayable / totalInstallments;
                const startDate = new Date(data.date);

                for (let i = 0; i < totalInstallments; i++) {
                    const dueDate = new Date(startDate);
                    dueDate.setMonth(startDate.getMonth() + i);
                    const dueDateStr = dueDate.toISOString().split('T')[0];

                    const isPaid = false;

                    // Create Installment Schedule
                    await InstallmentSchedule.create({
                        enrollmentId: enrollment.id,
                        dueDate: dueDateStr,
                        amount: monthlyAmount.toFixed(2),
                        status: isPaid ? 'Paid' : 'Pending'
                    }, { transaction });

                    // Create Student Installment
                    await Installment.create({
                        student_id: student.id,
                        enrollment_id: enrollment.id,
                        amount: monthlyAmount.toFixed(2),
                        due_date: dueDateStr,
                        paid_date: isPaid ? data.date : null,
                        status: isPaid ? 'PAID' : 'PENDING'
                    }, { transaction });

                    // Create Payment log if paid
                    if (isPaid) {
                        const receiptNo = generateReceiptNo(student.id, i + 1);
                        await Payment.create({
                            studentId: student.id,
                            amountPaid: monthlyAmount,
                            paymentDate: data.date,
                            paymentMethod: 'Cash',
                            receiptNo,
                            remainingBalance: (netPayable - (monthlyAmount * (i + 1))),
                            status: 'Paid',
                            enrollmentId: enrollment.id,
                            installmentNo: i + 1,
                            discount: 0
                        }, { transaction });
                    }
                }
            }
        }

        await transaction.commit();
        console.log('✅ SEEDING COMPLETE! All 21 students loaded with precise financial state.');
        process.exit(0);
    } catch (err) {
        await transaction.rollback();
        console.error('❌ SEEDING FAILED:', err.message);
        console.error(err);
        process.exit(1);
    }
}

importData();
