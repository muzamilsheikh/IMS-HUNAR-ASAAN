const { sendEmail, sendAdminManagerNotification, generateRandomPassword } = require('../utils/email');
const { getFeePaidTemplate, getInstallmentDueTemplate, getWelcomeTemplate, getStaffWelcomeTemplate, getStaffLoginAlertTemplate } = require('../utils/emailTemplates');
const { generateFeeChallanPDF } = require('./pdfService');
const { Setting } = require('../models');

/**
 * Send Fee Payment Confirmation Email with Triplicate 3-Copy Challan PDF Attachment
 */
const sendPaymentEmail = async (student, paymentData) => {
    try {
        const setting = await Setting.findOne();
        
        // Calculate balance
        const totalFee = parseFloat(student.totalFee || 0);
        const discount = parseFloat(student.discount || 0);
        const amountPaid = parseFloat(paymentData.amountPaid || 0);
        const remainingBalance = Math.max(0, totalFee - discount - parseFloat(student.paidAmount || 0));

        const courseName = student.Course?.name || student.courseName || 'Enrolled Course';
        const batchName = student.Batch?.name || student.batchName || 'Assigned Batch';
        const receiptNo = paymentData.receiptNo || `REC-${Date.now()}`;

        // 1. Generate HTML email body
        const emailHtml = getFeePaidTemplate(
            student.name,
            receiptNo,
            amountPaid,
            remainingBalance,
            courseName,
            batchName,
            paymentData.paymentMethod || 'Cash'
        );

        // 2. Generate Triplicate 3-Copy PDF Challan
        let pdfAttachments = [];
        try {
            const pdfBuffer = await generateFeeChallanPDF(
                {
                    receiptNo,
                    amountPaid,
                    paymentMethod: paymentData.paymentMethod || 'Cash',
                    totalFee,
                    discount,
                    balance: remainingBalance,
                    issueDate: new Date(),
                    dueDate: paymentData.dueDate || new Date()
                },
                student,
                setting
            );

            pdfAttachments.push({
                filename: `Challan_Receipt_${receiptNo}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
            });
        } catch (pdfErr) {
            console.error('Failed to generate 3-copy fee challan PDF attachment:', pdfErr.message);
        }

        // 3. Send email to student
        let sendResult = { success: false, skipped: true };
        if (student.email) {
            sendResult = await sendEmail(
                student.email,
                `Fee Payment Receipt - ${receiptNo}`,
                emailHtml,
                pdfAttachments,
                'payment'
            );
        }

        return { success: true, sendResult, attachmentsCount: pdfAttachments.length };
    } catch (err) {
        console.error('Error in sendPaymentEmail:', err.message);
        return { success: false, error: err.message };
    }
};

/**
 * Send Fee Challan Due Reminder Email with Triplicate 3-Copy Challan PDF Attachment
 */
const sendFeeChallanDueEmail = async (student, amountDue, dueDate) => {
    try {
        const setting = await Setting.findOne();
        const courseName = student.Course?.name || 'Skills Training';
        const batchName = student.Batch?.name || 'Assigned Batch';

        const bankDetails = setting?.bankName ? {
            bankName: setting.bankName,
            accountTitle: setting.accountTitle,
            accountNo: setting.accountNo,
            ibanCode: setting.ibanCode
        } : null;

        const emailHtml = getInstallmentDueTemplate(
            student.name,
            courseName,
            batchName,
            amountDue || 3000,
            dueDate || new Date(),
            bankDetails,
            setting?.paymentInstructions || ''
        );

        let pdfAttachments = [];
        try {
            const pdfBuffer = await generateFeeChallanPDF(
                {
                    amountDue: amountDue || 3000,
                    dueDate: dueDate || new Date(),
                    issueDate: new Date()
                },
                student,
                setting
            );

            pdfAttachments.push({
                filename: `Challan_${student.name.replace(/\s+/g, '_')}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
            });
        } catch (pdfErr) {
            console.error('Failed to generate fee challan PDF attachment:', pdfErr.message);
        }

        let sendResult = { success: false, skipped: true };
        if (student.email) {
            sendResult = await sendEmail(
                student.email,
                'Fee Installment Due Reminder - Hunar Asaan',
                emailHtml,
                pdfAttachments,
                'overdue'
            );
        }

        return { success: true, sendResult };
    } catch (err) {
        console.error('Error in sendFeeChallanDueEmail:', err.message);
        return { success: false, error: err.message };
    }
};

module.exports = {
    sendEmail,
    sendAdminManagerNotification,
    generateRandomPassword,
    sendPaymentEmail,
    sendFeeChallanDueEmail,
    generateFeeChallanPDF
};
