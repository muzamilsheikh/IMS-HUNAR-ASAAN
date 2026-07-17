const PDFDocument = require('pdfkit');

/**
 * Generate Fee Receipt PDF using PDFKit
 * Returns a Promise that resolves to a Buffer
 */
const generateReceiptPDF = (paymentData, student, setting) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const chunks = [];

            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', (err) => reject(err));

            // --- HEADER BLOCK ---
            doc.rect(0, 0, 612, 120).fill('#0f172a');
            
            doc.fillColor('#ffffff')
               .fontSize(22)
               .text(setting?.instituteName || 'HUNAR ASAAN', 50, 40, { align: 'left' });
            
            doc.fontSize(10)
               .fillColor('#38bdf8')
               .text('OFFICIAL FEE PAYMENT RECEIPT', 50, 70, { align: 'left' });

            doc.fillColor('#94a3b8')
               .fontSize(9)
               .text(`Date Issued: ${new Date().toLocaleDateString()}`, 400, 45, { align: 'right' });
            
            doc.text(`Receipt No: ${paymentData.receiptNo}`, 400, 60, { align: 'right' });

            // Restore fill color
            doc.fillColor('#1e293b');

            // --- STUDENT Vitals ---
            doc.fontSize(12)
               .font('Helvetica-Bold')
               .text('STUDENT INFORMATION', 50, 160);
            
            doc.moveTo(50, 175).lineTo(545, 175).stroke('#cbd5e1');

            doc.font('Helvetica')
               .fontSize(10)
               .text('Name:', 50, 190)
               .font('Helvetica-Bold')
               .text(student.name, 120, 190);

            doc.font('Helvetica')
               .text('Email:', 50, 210)
               .font('Helvetica-Bold')
               .text(student.email || 'N/A', 120, 210);

            doc.font('Helvetica')
               .text('Course Name:', 50, 230)
               .font('Helvetica-Bold')
               .text(student.Course?.name || 'Enrolled Course', 120, 230);

            doc.font('Helvetica')
               .text('Batch:', 50, 250)
               .font('Helvetica-Bold')
               .text(student.Batch?.name || 'Assigned Batch', 120, 250);

            // --- TRANSACTION DETAILS ---
            doc.fontSize(12)
               .font('Helvetica-Bold')
               .text('PAYMENT DETAILS', 50, 290);

            doc.moveTo(50, 305).lineTo(545, 305).stroke('#cbd5e1');

            doc.rect(50, 320, 495, 120).fill('#f8fafc');
            
            doc.fillColor('#334155')
               .font('Helvetica')
               .fontSize(10)
               .text('Total Course Fee:', 70, 340)
               .text('Discount Applied:', 70, 360)
               .text('Paid Amount:', 70, 380)
               .text('Outstanding Balance:', 70, 410);

            const totalFee = parseFloat(student.totalFee || 0);
            const discount = parseFloat(student.discount || 0);
            const amountPaid = parseFloat(paymentData.amountPaid || 0);
            const balance = Math.max(0, totalFee - discount - parseFloat(student.paidAmount || 0));

            doc.font('Helvetica-Bold')
               .text(`Rs. ${totalFee.toLocaleString()}`, 250, 340)
               .text(`Rs. ${discount.toLocaleString()}`, 250, 360)
               .fillColor('#047857')
               .text(`Rs. ${amountPaid.toLocaleString()}`, 250, 380)
               .fillColor('#ef4444')
               .text(`Rs. ${balance.toLocaleString()}`, 250, 410);

            doc.fillColor('#334155');

            // Payment method info box
            doc.rect(50, 460, 495, 60).fill('#ecfdf5');
            doc.fillColor('#065f46')
               .font('Helvetica-Bold')
               .text('TRANSACTION VERIFIED', 70, 475)
               .font('Helvetica')
               .fontSize(9)
               .text(`Method: ${paymentData.paymentMethod} | Status: PAID`, 70, 495);

            // --- BANK ACCOUNT INFO ---
            if (setting?.bankName) {
                doc.fillColor('#475569')
                   .fontSize(10)
                   .font('Helvetica-Bold')
                   .text('INSTITUTE BANK ACCOUNT DETAILS', 50, 550);

                doc.moveTo(50, 565).lineTo(545, 565).stroke('#cbd5e1');

                doc.font('Helvetica')
                   .fontSize(9)
                   .text(`Bank Name: ${setting.bankName}`, 50, 580)
                   .text(`Account Title: ${setting.accountTitle}`, 50, 595)
                   .text(`Account Number: ${setting.accountNo}`, 50, 610)
                   .text(`IBAN Code: ${setting.ibanCode || 'N/A'}`, 50, 625);
            }

            // --- FOOTER BLOCK ---
            doc.fillColor('#94a3b8')
               .fontSize(8)
               .text('This is a computer-generated fee receipt verified by the Hunar Asaan CRM. For verification or queries, please contact sadia@hunarasaan.com.', 50, 720, { align: 'center', width: 495 });

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
};

/**
 * Generate Fee Challan PDF using PDFKit
 * Returns a Promise that resolves to a Buffer
 */
const generateChallanPDF = (student, amountDue, dueDate, setting) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const chunks = [];

            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', (err) => reject(err));

            // --- HEADER BLOCK ---
            doc.rect(0, 0, 612, 120).fill('#1e293b');
            
            doc.fillColor('#ffffff')
               .fontSize(22)
               .text(setting?.instituteName || 'HUNAR ASAAN', 50, 40, { align: 'left' });
            
            doc.fontSize(10)
               .fillColor('#f87171')
               .text('OFFICIAL FEE CHALLAN & DUE NOTIFICATION', 50, 70, { align: 'left' });

            doc.fillColor('#94a3b8')
               .fontSize(9)
               .text(`Date Issued: ${new Date().toLocaleDateString()}`, 400, 45, { align: 'right' });
            
            doc.text(`Due Date: ${new Date(dueDate).toLocaleDateString()}`, 400, 60, { align: 'right' });

            doc.fillColor('#1e293b');

            // --- STUDENT Vitals ---
            doc.fontSize(12)
               .font('Helvetica-Bold')
               .text('STUDENT INFORMATION', 50, 160);
            
            doc.moveTo(50, 175).lineTo(545, 175).stroke('#cbd5e1');

            doc.font('Helvetica')
               .fontSize(10)
               .text('Name:', 50, 190)
               .font('Helvetica-Bold')
               .text(student.name, 120, 190);

            doc.font('Helvetica')
               .text('Email:', 50, 210)
               .font('Helvetica-Bold')
               .text(student.email || 'N/A', 120, 210);

            doc.font('Helvetica')
               .text('Course Name:', 50, 230)
               .font('Helvetica-Bold')
               .text(student.Course?.name || 'Enrolled Course', 120, 230);

            doc.font('Helvetica')
               .text('Batch:', 50, 250)
               .font('Helvetica-Bold')
               .text(student.Batch?.name || 'Assigned Batch', 120, 250);

            // --- CHALLAN SUMMARY ---
            doc.fontSize(12)
               .font('Helvetica-Bold')
               .text('CHALLAN SUMMARY', 50, 290);

            doc.moveTo(50, 305).lineTo(545, 305).stroke('#cbd5e1');

            doc.rect(50, 320, 495, 100).fill('#fef2f2');
            
            doc.fillColor('#991b1b')
               .font('Helvetica-Bold')
               .fontSize(12)
               .text(`AMOUNT DUE: Rs. ${parseFloat(amountDue).toLocaleString()}`, 70, 340)
               .fontSize(10)
               .fillColor('#7f1d1d')
               .text(`DUE DATE: ${new Date(dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, 70, 365)
               .font('Helvetica')
               .fontSize(9)
               .text('Please process payment before the due date to avoid service interruption.', 70, 390);

            // --- BANK ACCOUNT INFO ---
            if (setting?.bankName) {
                doc.fillColor('#475569')
                   .fontSize(10)
                   .font('Helvetica-Bold')
                   .text('DEPOSIT INSTRUCTIONS & BANK ACCOUNTS', 50, 450);

                doc.moveTo(50, 465).lineTo(545, 465).stroke('#cbd5e1');

                doc.rect(50, 480, 495, 90).fill('#f8fafc');

                doc.fillColor('#334155')
                   .font('Helvetica')
                   .fontSize(9)
                   .text(`Bank Name: ${setting.bankName}`, 70, 495)
                   .text(`Account Title: ${setting.accountTitle}`, 70, 510)
                   .text(`Account Number: ${setting.accountNo}`, 70, 525)
                   .text(`IBAN Code: ${setting.ibanCode || 'N/A'}`, 70, 540);
            }

            if (setting?.paymentInstructions) {
                doc.fillColor('#854d0e')
                   .fontSize(9)
                   .font('Helvetica-Bold')
                   .text('IMPORTANT INSTRUCTIONS', 50, 595);
                
                doc.font('Helvetica')
                   .fontSize(8)
                   .text(setting.paymentInstructions, 50, 610, { width: 495 });
            }

            doc.fillColor('#94a3b8')
               .fontSize(8)
               .text('This is an auto-generated fee challan by the Hunar Asaan CRM. Please send your transaction slip screen copy to sadia@hunarasaan.com.', 50, 720, { align: 'center', width: 495 });

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
};

module.exports = {
    generateReceiptPDF,
    generateChallanPDF
};
