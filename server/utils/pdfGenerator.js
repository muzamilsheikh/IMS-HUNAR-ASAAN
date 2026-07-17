const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

/**
 * Helper to draw a single copy column on the triplicate challan page
 */
const drawSingleChallanCopy = (doc, x, width, label, student, amountDue, dueDate, setting, logoPath) => {
    let y = 30;

    // 1. Copy Badge (top-right of column)
    doc.fillColor('#8a6a2f');
    doc.rect(x + width - 85, y, 85, 12).fill('#8a6a2f');
    doc.fillColor('#ffffff')
       .fontSize(6)
       .font('Helvetica-Bold')
       .text(label.toUpperCase(), x + width - 85, y + 3, { width: 85, align: 'center' });

    y += 18;

    // 2. Logo drawing
    let logoDrawn = false;
    if (logoPath && fs.existsSync(logoPath)) {
        try {
            doc.image(logoPath, x + (width - 45) / 2, y, { fit: [45, 45] });
            y += 50;
            logoDrawn = true;
        } catch (e) {
            console.error('PDF Logo draw failed:', e.message);
        }
    }
    
    if (!logoDrawn) {
        // Gold circle ring fallback logo
        doc.circle(x + width / 2, y + 22, 22).lineWidth(1.5).stroke('#8a6a2f');
        doc.circle(x + width / 2, y + 22, 19).fill('#1e293b');
        doc.fillColor('#8a6a2f')
           .fontSize(10)
           .font('Helvetica-Bold')
           .text('HA', x + width / 2 - 15, y + 17, { width: 30, align: 'center' });
        y += 50;
    }

    // Institute Letterhead Text
    doc.fillColor('#0f0d0b')
       .fontSize(11)
       .font('Helvetica-Bold')
       .text(setting?.instituteName || 'HUNAR ASAAN', x, y, { width, align: 'center' });
    
    y += 14;

    doc.fillColor('#7a6e65')
       .fontSize(7)
       .font('Helvetica')
       .text(setting?.address || 'Plot 14, Tech Avenue, Gulberg III, Lahore', x, y, { width, align: 'center' });
    
    y += 10;

    doc.text(`Phone: ${setting?.contact || '+92 300 0000000'} | Web: hunarasaan.com`, x, y, { width, align: 'center' });

    y += 12;

    doc.fillColor('#0f0d0b')
       .fontSize(9.5)
       .font('Helvetica-Bold')
       .text('FEE CHALLAN', x, y, { width, align: 'center' });

    y += 18;

    // Horizontal gold division line
    doc.moveTo(x, y).lineTo(x + width, y).stroke('#8a6a2f');
    y += 6;

    // 3. Metadata Grid
    const challanNo = `CHA-${new Date().getFullYear()}-${student.id || student._id || '9999'}`;
    const issueDateStr = new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    const dueDateStr = new Date(dueDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });

    // Row 1
    doc.fillColor('#7a6e65').fontSize(6.5).font('Helvetica').text('Challan No:', x, y);
    doc.fillColor('#1a1512').font('Helvetica-Bold').text(challanNo, x + 50, y);
    doc.fillColor('#7a6e65').font('Helvetica').text('Issue Date:', x + 125, y);
    doc.fillColor('#1a1512').font('Helvetica-Bold').text(issueDateStr, x + 175, y);
    
    y += 10;

    // Row 2
    doc.fillColor('#7a6e65').font('Helvetica').text('Due Date:', x, y);
    doc.fillColor('#ef4444').font('Helvetica-Bold').text(dueDateStr, x + 50, y);
    doc.fillColor('#7a6e65').font('Helvetica').text('Batch:', x + 125, y);
    doc.fillColor('#1a1512').font('Helvetica-Bold').text(student.Batch?.name || 'Unassigned', x + 175, y);

    y += 14;
    doc.moveTo(x, y).lineTo(x + width, y).stroke('#ede8df');
    y += 6;

    // 4. Student Information
    doc.fillColor('#7a6e65').fontSize(6.5).font('Helvetica').text('Student Name:', x, y);
    doc.fillColor('#1a1512').font('Helvetica-Bold').fontSize(7.5).text(student.name, x + 65, y);
    
    y += 11;

    doc.fillColor('#7a6e65').fontSize(6.5).font('Helvetica').text('Program / Course:', x, y);
    doc.fillColor('#1a1512').font('Helvetica-Bold').fontSize(7).text(student.Course?.name || 'Skills Training', x + 65, y);

    y += 14;
    doc.moveTo(x, y).lineTo(x + width, y).stroke('#8a6a2f');
    y += 6;

    // 5. Fee Heads Description Table
    doc.fillColor('#8a6a2f').fontSize(7).font('Helvetica-Bold').text('Fee Head Description', x, y);
    doc.text('Amount (PKR)', x + width - 65, y, { width: 65, align: 'right' });
    
    y += 10;
    doc.moveTo(x, y).lineTo(x + width, y).stroke('#ede8df');
    y += 6;

    doc.fillColor('#1a1512').font('Helvetica').fontSize(7.5).text('Tuition Fee / Installment', x, y);
    doc.fillColor('#1a1512').font('Helvetica-Bold').text(`Rs. ${parseFloat(amountDue).toLocaleString()}`, x + width - 65, y, { width: 65, align: 'right' });

    y += 14;
    doc.moveTo(x, y).lineTo(x + width, y).stroke('#ede8df');
    y += 6;

    doc.fillColor('#1a1512').font('Helvetica-Bold').fontSize(8).text('TOTAL DUES', x, y);
    doc.text(`Rs. ${parseFloat(amountDue).toLocaleString()}`, x + width - 65, y, { width: 65, align: 'right' });

    y += 12;
    doc.moveTo(x, y).lineTo(x + width, y).stroke('#8a6a2f');
    y += 8;

    // 6. Bank Details Box
    if (setting?.bankName) {
        doc.fillColor('#8a6a2f').fontSize(7).font('Helvetica-Bold').text('BANK DEPOSIT ACCOUNT', x, y);
        y += 9;
        doc.rect(x, y, width, 42).fill('#fcfbf7').stroke('#ede8df');
        doc.fillColor('#475569').font('Helvetica').fontSize(6.5);
        doc.text(`Bank Name: ${setting.bankName}`, x + 8, y + 5);
        doc.text(`Account Title: ${setting.accountTitle}`, x + 8, y + 13);
        doc.text(`Account Number: ${setting.accountNo}`, x + 8, y + 21);
        doc.text(`IBAN Code: ${setting.ibanCode || 'N/A'}`, x + 8, y + 29);
        y += 48;
    } else {
        y += 10;
    }

    // 7. Instructions block
    doc.fillColor('#7a6e65').fontSize(5.5).font('Helvetica').text('Terms: Fee once deposited is non-refundable. Retain this copy for academic records. Please upload paid voucher copy on student portal.', x, y, { width, align: 'left' });

    y += 24;

    // 8. Signatures Row
    doc.moveTo(x + 10, y).lineTo(x + 90, y).stroke('#cbd5e1');
    doc.moveTo(x + width - 90, y).lineTo(x + width - 10, y).stroke('#cbd5e1');
    
    y += 4;
    doc.fillColor('#a09890').fontSize(5).font('Helvetica')
       .text('Depositor Signature', x + 10, y, { width: 80, align: 'center' })
       .text('Authorized Signature', x + width - 90, y, { width: 80, align: 'center' });
};

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

            // --- FOOTER ---
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
 * Generate Upgraded Triplicate A4 Landscape Fee Challan PDF using PDFKit
 * Returns a Promise that resolves to a Buffer
 */
const generateChallanPDF = (student, amountDue, dueDate, setting) => {
    return new Promise((resolve, reject) => {
        try {
            // Setup A4 Landscape Document
            const doc = new PDFDocument({ margin: 20, size: 'A4', layout: 'landscape' });
            const chunks = [];

            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', (err) => reject(err));

            // Load Settings Logo if present
            let logoPath = null;
            if (setting && setting.logoUrl) {
                logoPath = path.join(__dirname, '..', setting.logoUrl);
            }
            if (!logoPath || !fs.existsSync(logoPath)) {
                const defaultLogo = path.join(__dirname, '../uploads/settings/logo.jpg');
                if (fs.existsSync(defaultLogo)) {
                    logoPath = defaultLogo;
                }
            }

            // A4 Landscape Printable width: 842 total, minus margins = 802.
            // Split into 3 columns, each column width is 240, column gap is 28.
            const colWidth = 240;
            const colGap = 28;
            const startX = 20;

            const copies = ['Bank Copy', 'Institute Copy', 'Student Copy'];

            // Draw each copy column
            copies.forEach((label, index) => {
                const x = startX + index * (colWidth + colGap);
                drawSingleChallanCopy(doc, x, colWidth, label, student, amountDue, dueDate, setting, logoPath);

                // Draw vertical dotted line divider between columns
                if (index < 2) {
                    const dividerX = x + colWidth + (colGap / 2);
                    doc.moveTo(dividerX, 20)
                       .lineTo(dividerX, 575)
                       .lineWidth(1)
                       .dash(4, { space: 4 })
                       .stroke('#cbd5e1');
                    // Reset dash for table/grid borders
                    doc.undash();
                }
            });

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
