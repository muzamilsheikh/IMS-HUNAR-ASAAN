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

    try {
        // Capture element with high scale for high-DPI crisp print quality
        const canvas = await html2canvas(element, {
            scale: 3, // 3x resolution for high crisp quality
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            allowTaint: true,
            onclone: (clonedDoc) => {
                // Remove style rules containing oklch to prevent html2canvas parsing errors
                const styleSheets = Array.from(clonedDoc.styleSheets || []);
                styleSheets.forEach(sheet => {
                    try {
                        const rules = sheet.cssRules || sheet.rules;
                        if (!rules) return;
                        for (let i = rules.length - 1; i >= 0; i--) {
                            if (rules[i].cssText && rules[i].cssText.includes('oklch')) {
                                sheet.deleteRule(i);
                            }
                        }
                    } catch (e) {
                        // ignore CORS/cross-domain stylesheet security errors
                    }
                });

                // Also replace oklch in style tags
                const styles = clonedDoc.querySelectorAll('style');
                styles.forEach(s => {
                    if (s.textContent && s.textContent.includes('oklch')) {
                        s.textContent = s.textContent.replace(/oklch\([^)]+\)/gi, '#0f172a');
                    }
                });
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
