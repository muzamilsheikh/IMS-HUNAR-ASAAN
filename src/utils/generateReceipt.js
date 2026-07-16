import { logoBase64 } from './logoBase64';

// ─────────────────────────────────────────────────────────────
//  Design Tokens
// ─────────────────────────────────────────────────────────────
const ACCENT       = '#1e3a8a';   // Primary deep-blue brand accent
const ACCENT_LIGHT = '#dbeafe';   // Tint for badge/status fills
const ACCENT_PAID  = '#14532d';   // Deep green for PAID status
const ACCENT_UNPAID = '#7f1d1d';  // Deep red for NOT PAID status
const GOLD         = '#92763c';   // Secondary warm-gold accent for labels/totals
const MONO_FONT    = "'IBM Plex Mono', 'Courier New', monospace";
const SERIF_FONT   = "'Playfair Display', 'Georgia', serif";
const BODY_FONT    = "'IBM Plex Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif";

// ─────────────────────────────────────────────────────────────
//  Helper
// ─────────────────────────────────────────────────────────────
const fmtPKR  = (n) => `Rs.\u00a0${Number(n || 0).toLocaleString('en-PK')}`;
const fmtDate = (d) => {
    if (!d) return '—';
    try {
        return new Date(d).toLocaleDateString('en-PK', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    } catch { return String(d); }
};

// ─────────────────────────────────────────────────────────────
//  Single copy HTML block
// ─────────────────────────────────────────────────────────────
function buildCopy({ copyLabel, isLast, data, status, settings }) {
    const {
        studentName, studentId, course,
        amount, balance, method, date, receiptNo
    } = data;

    const isPaid     = status === 'PAID';
    const docLabel   = isPaid ? 'Payment Receipt' : 'Fee Voucher';
    const statusText = isPaid ? 'PAID' : 'NOT PAID';
    const statusBg   = isPaid ? '#dcfce7' : '#fee2e2';
    const statusColor = isPaid ? ACCENT_PAID : ACCENT_UNPAID;
    const amountLabel = isPaid ? 'Amount Paid' : 'Amount Due';

    const dividerStyle = isLast
        ? ''
        : `border-right: 1.5px dashed #c7d2e8;`;

    return `
    <div style="
        flex: 1;
        padding: 24px 20px 18px;
        position: relative;
        display: flex;
        flex-direction: column;
        min-height: 794px;
        box-sizing: border-box;
        ${dividerStyle}
        font-family: ${BODY_FONT};
        color: #111827;
    ">

        <!-- Copy badge (top-right) -->
        <div style="display:flex; justify-content:flex-end; margin-bottom:8px;">
            <span style="
                font-size: 7px;
                font-weight: 700;
                letter-spacing: 1.1px;
                text-transform: uppercase;
                color: ${ACCENT};
                border: 1px solid ${ACCENT};
                border-radius: 20px;
                padding: 2px 10px;
                line-height: 1.7;
            ">${copyLabel}</span>
        </div>

        <!-- ── Letterhead ── -->
        <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 5px;
            padding-bottom: 12px;
            margin-bottom: 11px;
            border-bottom: 2px solid ${ACCENT};
        ">
            <!-- Logo ring -->
            <div style="
                width: 40px;
                height: 40px;
                border-radius: 50%;
                border: 1.5px solid ${GOLD};
                padding: 3px;
                box-sizing: border-box;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
            ">
                <img
                    src="${logoBase64}"
                    alt="Hunar Asaan Logo"
                    style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;"
                    onerror="this.style.display='none'; this.parentNode.innerHTML='<span style=\\'font-family:${SERIF_FONT};font-size:11px;font-weight:700;color:${GOLD}\\'>HA</span>';"
                />
            </div>

            <!-- Institute name -->
            <div style="
                font-family: ${SERIF_FONT};
                font-size: 13.5px;
                font-weight: 700;
                letter-spacing: 0.05px;
                color: #0f0d0b;
                line-height: 1.25;
                margin-top: 2px;
            ">Hunar Asaan Skill Center</div>

            <!-- Address -->
            <div style="font-size: 7.5px; color: #6b7280; line-height: 1.5;">
                Plot 14, Tech Avenue, Gulberg III, Lahore, Pakistan
            </div>
            <div style="font-size: 7.5px; color: #6b7280;">
                +92 300 0000000 &nbsp;·&nbsp; info@hunarasaan.edu &nbsp;·&nbsp; hunarasaan.edu
            </div>

            <!-- Document type heading -->
            <div style="
                font-size: 9px;
                font-weight: 700;
                letter-spacing: 1.8px;
                text-transform: uppercase;
                color: #0f0d0b;
                margin-top: 3px;
            ">${docLabel}</div>
        </div>

        <!-- ── Meta grid ── -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px 8px; margin-bottom: 11px;">
            <div>
                <div style="font-size:7.5px;font-weight:600;letter-spacing:0.9px;text-transform:uppercase;color:#6b7280;">Receipt No.</div>
                <div style="font-family:${MONO_FONT};font-weight:600;font-size:9px;margin-top:1px;color:#111827;">${receiptNo || '—'}</div>
            </div>
            <div>
                <div style="font-size:7.5px;font-weight:600;letter-spacing:0.9px;text-transform:uppercase;color:#6b7280;">${isPaid ? 'Date Paid' : 'Due Date'}</div>
                <div style="font-family:${MONO_FONT};font-weight:600;font-size:9px;margin-top:1px;color:${isPaid ? '#111827' : '#b91c1c'};">${fmtDate(date)}</div>
            </div>
            <div>
                <div style="font-size:7.5px;font-weight:600;letter-spacing:0.9px;text-transform:uppercase;color:#6b7280;">Payment Method</div>
                <div style="font-family:${MONO_FONT};font-weight:600;font-size:9px;margin-top:1px;color:#111827;">${method || '—'}</div>
            </div>
            <div>
                <div style="font-size:7.5px;font-weight:600;letter-spacing:0.9px;text-transform:uppercase;color:#6b7280;">Status</div>
                <div style="
                    display:inline-block;
                    margin-top:2px;
                    background:${statusBg};
                    color:${statusColor};
                    font-size:7px;
                    font-weight:700;
                    letter-spacing:0.7px;
                    text-transform:uppercase;
                    padding:2px 8px;
                    border-radius:20px;
                ">${statusText}</div>
            </div>
        </div>

        <!-- ── Student section ── -->
        <div style="
            display: flex;
            flex-direction: column;
            gap: 5px;
            padding: 9px 0;
            margin-bottom: 11px;
            border-top: 1px solid #e5e7eb;
            border-bottom: 1px solid #e5e7eb;
        ">
            <div>
                <div style="font-size:7.5px;font-weight:600;letter-spacing:0.9px;text-transform:uppercase;color:#6b7280;">Student Name</div>
                <div style="font-weight:600;font-size:9.5px;margin-top:1px;color:#111827;">${studentName || '—'}</div>
            </div>
            <div>
                <div style="font-size:7.5px;font-weight:600;letter-spacing:0.9px;text-transform:uppercase;color:#6b7280;">Student ID</div>
                <div style="font-family:${MONO_FONT};font-weight:600;font-size:9.5px;margin-top:1px;color:#111827;">${studentId || '—'}</div>
            </div>
            <div>
                <div style="font-size:7.5px;font-weight:600;letter-spacing:0.9px;text-transform:uppercase;color:#6b7280;">Course / Track</div>
                <div style="font-weight:600;font-size:9.5px;margin-top:1px;color:#111827;">${course || '—'}</div>
            </div>
        </div>

        <!-- ── Fee table ── -->
        <table style="width:100%;border-collapse:collapse;margin-bottom:12px;">
            <thead>
                <tr>
                    <th style="text-align:left;padding:0 0 5px;font-size:7.5px;font-weight:600;letter-spacing:0.8px;text-transform:uppercase;color:#6b7280;border-bottom:1.2px solid ${ACCENT};">Description</th>
                    <th style="text-align:right;padding:0 0 5px;font-size:7.5px;font-weight:600;letter-spacing:0.8px;text-transform:uppercase;color:#6b7280;border-bottom:1.2px solid ${ACCENT};">PKR</th>
                </tr>
            </thead>
            <tbody>
                <tr style="border-bottom:1px solid #f3f4f6;">
                    <td style="padding:5px 0;font-size:8.5px;color:#374151;">${amountLabel}</td>
                    <td style="padding:5px 0;text-align:right;font-family:${MONO_FONT};font-size:8.5px;font-weight:500;color:#111827;">${fmtPKR(amount)}</td>
                </tr>
                <tr style="border-bottom:1px solid #f3f4f6;">
                    <td style="padding:5px 0;font-size:8.5px;color:#374151;">Remaining Balance</td>
                    <td style="padding:5px 0;text-align:right;font-family:${MONO_FONT};font-size:8.5px;font-weight:500;color:${balance > 0 ? '#b91c1c' : '#15803d'};">${fmtPKR(balance)}</td>
                </tr>
                <!-- Total row -->
                <tr>
                    <td style="
                        padding:8px 0 2px;
                        font-family:${SERIF_FONT};
                        font-weight:700;
                        font-size:10px;
                        color:#111827;
                        border-top:1.5px solid ${ACCENT};
                    ">Total ${isPaid ? 'Received' : 'Due'}</td>
                    <td style="
                        padding:8px 0 2px;
                        text-align:right;
                        font-family:${MONO_FONT};
                        font-weight:700;
                        font-size:12px;
                        color:${GOLD};
                        border-top:1.5px solid ${ACCENT};
                    ">${fmtPKR(amount)}</td>
                </tr>
            </tbody>
        </table>

        <!-- ── Bank details ── -->
        <div style="margin-bottom:10px;">
            <div style="
                font-size:7.5px;
                font-weight:600;
                letter-spacing:0.9px;
                text-transform:uppercase;
                color:${GOLD};
                margin-bottom:5px;
            ">Bank Transfer Details</div>
            <div style="font-size:8px;color:#374151;line-height:1.65;">
                <div><span style="color:#6b7280;">Bank: </span><b>${settings?.bankName || 'Meezan Bank Ltd., Gulberg Branch'}</b></div>
                <div><span style="color:#6b7280;">A/C Title: </span><b>${settings?.accountTitle || 'Hunar Asaan Skill Center'}</b></div>
                <div><span style="color:#6b7280;">A/C No.: </span><b style="font-family:${MONO_FONT}">${settings?.accountNo || '0110-1234567-001'}</b></div>
                <div><span style="color:#6b7280;">IBAN: </span><b style="font-family:${MONO_FONT}">${settings?.ibanCode || 'PK36 MEZN 0001 1012 3456 7001'}</b></div>
                ${settings?.paymentInstructions ? `<div style="margin-top:4px;font-size:7.5px;color:#4b5563;font-style:italic;">Note: ${settings.paymentInstructions}</div>` : ''}
            </div>
        </div>

        <!-- Spacer -->
        <div style="flex:1;"></div>

        <!-- ── Signature block ── -->
        <div style="text-align:center; margin-bottom:8px;">
            <div style="
                border-top: 1px solid #6b7280;
                padding-top: 4px;
                font-size: 7.5px;
                color: #6b7280;
                margin-top: 14px;
                width: 68%;
                margin-left: auto;
                margin-right: auto;
            ">Authorized Signature</div>
        </div>

        <!-- ── Footer ── -->
        <div style="
            padding-top: 7px;
            border-top: 1px solid #f3f4f6;
            font-size: 6.5px;
            color: #9ca3af;
            text-align: center;
            line-height: 1.5;
        ">
            This is a computer-generated document &nbsp;·&nbsp;
            Fee once deposited is non-refundable &nbsp;·&nbsp;
            Please retain this document
        </div>

    </div>`;
}

// ─────────────────────────────────────────────────────────────
//  Main export — opens a fresh browser window and triggers print
// ─────────────────────────────────────────────────────────────

/**
 * generateReceipt — opens a premium A4-landscape tri-plicate
 * payment receipt/voucher in a new browser window and triggers
 * window.print() for seamless browser PDF/print output.
 *
 * @param {object} paymentData
 *   @param {string} paymentData.studentName
 *   @param {string|number} paymentData.studentId
 *   @param {string} paymentData.course
 *   @param {number} paymentData.amount       – amount paid / due
 *   @param {number} paymentData.balance      – remaining balance
 *   @param {string} paymentData.method       – payment method label
 *   @param {string} paymentData.date         – ISO or human-readable date
 *   @param {string} paymentData.receiptNo    – unique receipt / voucher number
 * @param {'PAID'|'NOT PAID'} [status='PAID']
 * @param {object} [settings=null]            - global settings for dynamic bank details
 */
export default function generateReceipt(paymentData, status = 'PAID', settings = null) {
    const isPaid     = status === 'PAID';
    const docTitle   = isPaid ? 'Payment Receipt' : 'Fee Voucher';
    const fileName   = `${isPaid ? 'Receipt' : 'Voucher'}-${paymentData.receiptNo || 'HA'}`;
    const copyLabels = ['Bank Copy', 'Institute Copy', 'Student Copy'];

    const copies = copyLabels
        .map((label, i) =>
            buildCopy({
                copyLabel: label,
                isLast: i === copyLabels.length - 1,
                data: paymentData,
                status,
                settings,
            })
        )
        .join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${fileName}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap" rel="stylesheet">
<style>
    *, *::before, *::after { box-sizing: border-box; }

    html, body {
        margin: 0;
        padding: 0;
        background: #f1f5f9;
        font-family: 'IBM Plex Sans', Helvetica, Arial, sans-serif;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        color-adjust: exact;
    }

    .sheet-wrapper {
        width: 1123px;
        min-height: 794px;
        margin: 32px auto;
        background: #ffffff;
        box-shadow: 0 4px 32px rgba(20,30,50,0.12);
        border-radius: 4px;
        display: flex;
        overflow: hidden;
    }

    .no-print {
        text-align: center;
        padding: 14px 0 0;
    }

    .print-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 26px;
        background: ${ACCENT};
        color: #fff;
        border: none;
        border-radius: 10px;
        font-family: 'IBM Plex Sans', sans-serif;
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 0.3px;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(30,58,138,0.22);
        transition: transform 0.15s;
    }
    .print-btn:hover { transform: translateY(-1px); }

    @media print {
        html, body {
            background: #fff;
            margin: 0;
            padding: 0;
        }
        .no-print { display: none !important; }
        .sheet-wrapper {
            margin: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            width: 100% !important;
            min-height: 0 !important;
            page-break-after: avoid;
        }
        @page {
            size: A4 landscape;
            margin: 0;
        }
    }
</style>
</head>
<body>

    <!-- Print / Close toolbar -->
    <div class="no-print">
        <button class="print-btn" onclick="window.print()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 6 2 18 2 18 9"/>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8"/>
            </svg>
            Print / Save as PDF
        </button>
        &nbsp;
        <button class="print-btn" style="background:#4b5563;" onclick="window.close()">Close</button>
    </div>

    <!-- The A4 landscape challan sheet -->
    <div class="sheet-wrapper">
        ${copies}
    </div>

    <script>
        // Auto-trigger print after fonts have loaded
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => { window.print(); });
        } else {
            setTimeout(() => { window.print(); }, 800);
        }
    <\/script>
</body>
</html>`;

    // Open in a new window and write the HTML document
    const win = window.open('', '_blank', 'width=1200,height=850,scrollbars=yes');
    if (!win) {
        console.warn('generateReceipt: popup was blocked — please allow popups for this site.');
        return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
}
