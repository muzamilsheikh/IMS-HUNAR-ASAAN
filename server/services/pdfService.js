const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

/**
 * Draw a single copy column on the triplicate A4 landscape challan
 */
const drawSingleChallanColumn = (doc, x, width, label, data, student, setting, logoPath) => {
    let y = 24;

    // 1. Copy Badge (top-right of column)
    doc.fillColor('#8a6a2f');
    doc.rect(x + width - 85, y, 85, 13).fill('#8a6a2f');
    doc.fillColor('#ffffff')
       .fontSize(6.5)
       .font('Helvetica-Bold')
       .text(label.toUpperCase(), x + width - 85, y + 3.5, { width: 85, align: 'center' });

    y += 18;

    // 2. Logo drawing
    let logoDrawn = false;
    if (logoPath && fs.existsSync(logoPath)) {
        try {
            doc.image(logoPath, x + (width - 40) / 2, y, { fit: [40, 40] });
            y += 44;
            logoDrawn = true;
        } catch (e) {
            console.error('PDF Logo draw failed:', e.message);
        }
    }
    
    if (!logoDrawn) {
        // Gold circle ring fallback logo
        doc.circle(x + width / 2, y + 18, 18).lineWidth(1.2).stroke('#8a6a2f');
        doc.circle(x + width / 2, y + 18, 15).fill('#1e293b');
        doc.fillColor('#8a6a2f')
           .fontSize(9)
           .font('Helvetica-Bold')
           .text('HA', x + width / 2 - 15, y + 14, { width: 30, align: 'center' });
        y += 42;
    }

    // Institute Letterhead Text
    doc.fillColor('#0f0d0b')
       .fontSize(10)
       .font('Helvetica-Bold')
       .text(setting?.instituteName || 'HUNAR ASAAN', x, y, { width, align: 'center' });
    
    y += 13;

    doc.fillColor('#7a6e65')
       .fontSize(6.5)
       .font('Helvetica')
       .text(setting?.address || 'Plot 14, Tech Avenue, Gulberg III, Lahore', x, y, { width, align: 'center' });
    
    y += 9;

    const contactStr = `${setting?.contact || '+92 323 1218000'} | ${setting?.officialEmail || 'info@hunarasaan.com'}`;
    doc.text(contactStr, x, y, { width, align: 'center' });

    y += 11;

    doc.fillColor('#0f0d0b')
       .fontSize(8.5)
       .font('Helvetica-Bold')
       .text('FEE CHALLAN / RECEIPT', x, y, { width, align: 'center' });

    y += 14;

    // Horizontal gold division line
    doc.moveTo(x, y).lineTo(x + width, y).stroke('#8a6a2f');
    y += 6;

    // 3. Metadata Grid
    const receiptNo = data?.receiptNo || data?.challanNo || `REC-${Date.now()}`;
    const issueDateStr = data?.issueDate 
        ? new Date(data.issueDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
        : new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    
    const dueDateStr = data?.dueDate
        ? new Date(data.dueDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
        : new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });

    const batchName = student?.Batch?.name || student?.batchName || data?.batchName || 'Assigned Batch';
    const courseName = student?.Course?.name || student?.courseName || data?.courseName || 'Skills Training';
    const studentName = student?.name || data?.studentName || 'Student Copy';

    // Row 1
    doc.fillColor('#7a6e65').fontSize(6).font('Helvetica').text('Challan/Receipt #:', x, y);
    doc.fillColor('#1a1512').font('Helvetica-Bold').text(receiptNo, x + 60, y);
    doc.fillColor('#7a6e65').font('Helvetica').text('Issue Date:', x + 130, y);
    doc.fillColor('#1a1512').font('Helvetica-Bold').text(issueDateStr, x + 175, y);
    
    y += 9;

    // Row 2
    doc.fillColor('#7a6e65').font('Helvetica').text('Due / Valid Date:', x, y);
    doc.fillColor('#ef4444').font('Helvetica-Bold').text(dueDateStr, x + 60, y);
    doc.fillColor('#7a6e65').font('Helvetica').text('Batch:', x + 130, y);
    doc.fillColor('#1a1512').font('Helvetica-Bold').text(batchName, x + 175, y);

    y += 11;
    doc.moveTo(x, y).lineTo(x + width, y).stroke('#ede8df');
    y += 5;

    // 4. Student Information
    doc.fillColor('#7a6e65').fontSize(6).font('Helvetica').text('Student Name:', x, y);
    doc.fillColor('#1a1512').font('Helvetica-Bold').fontSize(7).text(studentName, x + 55, y);
    
    y += 9;

    doc.fillColor('#7a6e65').fontSize(6).font('Helvetica').text('Program / Course:', x, y);
    doc.fillColor('#1a1512').font('Helvetica-Bold').fontSize(6.5).text(courseName, x + 55, y);

    if (data?.paymentMethod) {
        y += 9;
        doc.fillColor('#7a6e65').fontSize(6).font('Helvetica').text('Payment Method:', x, y);
        doc.fillColor('#047857').font('Helvetica-Bold').fontSize(6.5).text(String(data.paymentMethod).toUpperCase(), x + 55, y);
    }

    y += 11;
    doc.moveTo(x, y).lineTo(x + width, y).stroke('#8a6a2f');
    y += 5;

    // 5. Fee Heads Breakdown Table
    doc.fillColor('#8a6a2f').fontSize(6.5).font('Helvetica-Bold').text('Fee Head Description', x, y);
    doc.text('Amount (PKR)', x + width - 60, y, { width: 60, align: 'right' });
    
    y += 9;
    doc.moveTo(x, y).lineTo(x + width, y).stroke('#ede8df');
    y += 5;

    const totalFee = parseFloat(data?.totalFee || student?.totalFee || 0);
    const amountPaid = parseFloat(data?.amountPaid || data?.amountDue || data?.paidAmount || 0);
    const discount = parseFloat(data?.discount || student?.discount || 0);
    const balance = data?.balance !== undefined 
        ? parseFloat(data.balance) 
        : (totalFee > 0 ? Math.max(0, totalFee - discount - amountPaid) : 0);

    if (totalFee > 0) {
        doc.fillColor('#1a1512').font('Helvetica').fontSize(6.5).text('Total Course Fee', x, y);
        doc.fillColor('#1a1512').font('Helvetica-Bold').text(`Rs. ${totalFee.toLocaleString()}`, x + width - 60, y, { width: 60, align: 'right' });
        y += 9;
        doc.moveTo(x, y).lineTo(x + width, y).stroke('#ede8df');
        y += 4;
    }

    doc.fillColor('#1a1512').font('Helvetica').fontSize(6.5).text('Paid / Deposited Amount', x, y);
    doc.fillColor('#047857').font('Helvetica-Bold').text(`Rs. ${amountPaid.toLocaleString()}`, x + width - 60, y, { width: 60, align: 'right' });
    y += 9;

    if (balance > 0) {
        doc.moveTo(x, y).lineTo(x + width, y).stroke('#ede8df');
        y += 4;
        doc.fillColor('#1a1512').font('Helvetica').fontSize(6.5).text('Remaining Balance', x, y);
        doc.fillColor('#ef4444').font('Helvetica-Bold').text(`Rs. ${balance.toLocaleString()}`, x + width - 60, y, { width: 60, align: 'right' });
        y += 9;
    }

    doc.moveTo(x, y).lineTo(x + width, y).stroke('#ede8df');
    y += 4;

    doc.fillColor('#1a1512').font('Helvetica-Bold').fontSize(7).text('NET AMOUNT VERIFIED', x, y);
    doc.text(`Rs. ${amountPaid.toLocaleString()}`, x + width - 60, y, { width: 60, align: 'right' });

    y += 10;
    doc.moveTo(x, y).lineTo(x + width, y).stroke('#8a6a2f');
    y += 6;

    // 6. Bank Details Box
    const bankName = setting?.bankName || 'Meezan Bank';
    const accountTitle = setting?.accountTitle || 'Hunar Asaan Skill Center';
    const accountNo = setting?.accountNo || '010203040506';
    const ibanCode = setting?.ibanCode || 'PK00MEZN0000000102030405';

    doc.fillColor('#8a6a2f').fontSize(6).font('Helvetica-Bold').text('BANK DEPOSIT ACCOUNT', x, y);
    y += 7;
    doc.rect(x, y, width, 36).fill('#fcfbf7').stroke('#ede8df');
    doc.fillColor('#475569').font('Helvetica').fontSize(5.5);
    doc.text(`Bank: ${bankName}`, x + 6, y + 4);
    doc.text(`Title: ${accountTitle}`, x + 6, y + 11);
    doc.text(`Account #: ${accountNo}`, x + 6, y + 18);
    doc.text(`IBAN: ${ibanCode}`, x + 6, y + 25);
    y += 40;

    // 7. Instructions block
    doc.fillColor('#7a6e65').fontSize(5).font('Helvetica').text('Terms: Fee once deposited is non-refundable. Retain this copy for academic records. Upload payment voucher on student portal.', x, y, { width, align: 'left' });

    y += 16;

    // 8. Signature Stamp Image & Lines
    if (setting && setting.signatureUrl) {
        const sigPath = path.join(__dirname, '..', setting.signatureUrl);
        if (fs.existsSync(sigPath)) {
            try {
                doc.image(sigPath, x + width - 75, y - 12, { fit: [60, 20] });
            } catch (e) {
                console.error('Failed to draw signature image in PDF:', e.message);
            }
        }
    }

    doc.moveTo(x + 5, y + 6).lineTo(x + 75, y + 6).stroke('#cbd5e1');
    doc.moveTo(x + width - 75, y + 6).lineTo(x + width - 5, y + 6).stroke('#cbd5e1');
    
    const sigLabel = setting?.signatureTitle || 'Authorized Signature';
    doc.fillColor('#a09890').fontSize(5).font('Helvetica')
       .text('Depositor Signature', x + 5, y + 9, { width: 70, align: 'center' })
       .text(sigLabel, x + width - 80, y + 9, { width: 80, align: 'center' });
};

/**
 * Generate Fee Challan 3-Copy Triplicate PDF (Bank, Institute, Student Copy)
 * Returns a Promise that resolves to a Buffer
 */
const generateFeeChallanPDF = async (data = {}, student = null, setting = null) => {
    // If setting is not provided, try to fetch from DB if available
    let settingObj = setting;
    if (!settingObj) {
        try {
            const { Setting } = require('../models');
            if (Setting) {
                settingObj = await Setting.findOne();
            }
        } catch (e) {
            // Fallback default
        }
    }

    if (!settingObj) {
        settingObj = {
            instituteName: 'HUNAR ASAAN',
            address: 'Plot 14, Tech Avenue, Gulberg III, Lahore',
            contact: '+92 323 1218000',
            officialEmail: 'info@hunarasaan.com',
            bankName: 'Meezan Bank',
            accountTitle: 'Hunar Asaan',
            accountNo: '010203040506',
            ibanCode: 'PK00MEZN0000000102030405'
        };
    }

    const studentObj = student || {
        name: data?.studentName || 'Student Copy',
        email: data?.studentEmail || '',
        Course: { name: data?.courseName || 'Enrolled Course' },
        Batch: { name: data?.batchName || 'Assigned Batch' }
    };

    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 18, size: 'A4', layout: 'landscape' });
            const chunks = [];

            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', (err) => reject(err));

            // Load Settings Logo if present
            let logoPath = null;
            if (settingObj && settingObj.logoUrl) {
                logoPath = path.join(__dirname, '..', settingObj.logoUrl);
            }
            if (!logoPath || !fs.existsSync(logoPath)) {
                const defaultLogo = path.join(__dirname, '../uploads/settings/logo.jpg');
                if (fs.existsSync(defaultLogo)) {
                    logoPath = defaultLogo;
                }
            }

            // A4 Landscape Printable width: 842 total, minus margins
            const colWidth = 240;
            const colGap = 28;
            const startX = 18;

            const copies = ['Bank Copy', 'Institute Copy', 'Student Copy'];

            // Draw each copy column
            copies.forEach((label, index) => {
                const x = startX + index * (colWidth + colGap);
                drawSingleChallanColumn(doc, x, colWidth, label, data, studentObj, settingObj, logoPath);

                // Draw vertical dotted divider line between columns
                if (index < 2) {
                    const dividerX = x + colWidth + (colGap / 2);
                    doc.moveTo(dividerX, 18)
                       .lineTo(dividerX, 575)
                       .lineWidth(1)
                       .dash(4, { space: 4 })
                       .stroke('#cbd5e1');
                    doc.undash();
                }
            });

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
};

/**
 * Backwards compatible alias
 */
const generateChallanPDF = (student, amountDue, dueDate, setting) => {
    return generateFeeChallanPDF({ amountDue, dueDate }, student, setting);
};

const generateReceiptPDF = (paymentData, student, setting) => {
    return generateFeeChallanPDF(paymentData, student, setting);
};

module.exports = {
    generateFeeChallanPDF,
    generateChallanPDF,
    generateReceiptPDF
};
