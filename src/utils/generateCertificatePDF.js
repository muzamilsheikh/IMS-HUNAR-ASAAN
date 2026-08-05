import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Generate PDF / Image from Certificate DOM Element
 * @param {HTMLElement} element - The DOM element containing the certificate layout
 * @param {string} filename - Filename for PDF download
 * @param {boolean} returnBase64 - If true, returns base64 string instead of downloading
 */
export const generateCertificatePDF = async (element, filename = 'Certificate.pdf', returnBase64 = false) => {
    if (!element) {
        throw new Error('Certificate element not provided');
    }

    // Backup and temporarily strip oklch from all style tags in main window
    const originalStyles = [];
    const styleElements = Array.from(document.querySelectorAll('style'));
    
    styleElements.forEach(el => {
        if (el.textContent && el.textContent.includes('oklch')) {
            originalStyles.push({ el, original: el.textContent });
            el.textContent = el.textContent.replace(/oklch\([^)]+\)/gi, '#0f172a');
        }
    });

    try {
        // Capture element with high scale for high-DPI crisp print quality
        const canvas = await html2canvas(element, {
            scale: 2, // 2x resolution for crisp print quality
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            allowTaint: true,
            onclone: (clonedDoc) => {
                try {
                    const styleTags = clonedDoc.getElementsByTagName('style');
                    for (let i = 0; i < styleTags.length; i++) {
                        if (styleTags[i] && styleTags[i].textContent && styleTags[i].textContent.includes('oklch')) {
                            styleTags[i].textContent = styleTags[i].textContent.replace(/oklch\([^)]+\)/gi, '#0f172a');
                        }
                    }
                } catch (e) {
                    console.warn('oklch replacement in cloned doc failed:', e);
                }
            }
        });

        const imgData = canvas.toDataURL('image/png', 1.0);

        // A4 Landscape dimensions in mm
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

        if (returnBase64) {
            return {
                pdfBase64: pdf.output('datauristring'),
                pngBase64: imgData
            };
        }

        // Save PDF to user's computer
        pdf.save(filename);
        return { success: true };
    } catch (err) {
        console.error('Error generating certificate PDF:', err);
        throw err;
    } finally {
        // Always restore original stylesheet contents in main window
        originalStyles.forEach(item => {
            if (item.el && item.original) {
                item.el.textContent = item.original;
            }
        });
    }
};

/**
 * Quick print certificate via hidden print iframe or window
 */
export const printCertificateWindow = (element) => {
    if (!element) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
            <head>
                <title>Certificate Print</title>
                <style>
                    @page { size: landscape; margin: 0; }
                    body { margin: 0; padding: 0; background: white; }
                    .print-container { width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; }
                </style>
            </head>
            <body>
                <div class="print-container">
                    ${element.outerHTML}
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() { window.close(); }, 500);
                    }
                </script>
            </body>
        </html>
    `);
    printWindow.document.close();
};
