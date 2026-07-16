import React, { useRef } from 'react';

// ─────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────
const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString('en-PK')}`;

const COPY_LABELS = ['Bank Copy', 'Institute Copy', 'Student Copy'];

const ACCENT = '#8a6a2f';
const ACCENT_LIGHT = 'rgba(138,106,47,0.10)';
const BORDER_SUBTLE = '#ede8df';
const TEXT_MAIN = '#1a1512';
const TEXT_MUTED = '#7a6e65';
const TEXT_DIM = '#a09890';

const styles = {
  printBtn: {
    position: 'fixed',
    top: 16,
    right: 20,
    zIndex: 9999,
    display: 'flex',
    gap: 10,
    alignItems: 'center',
  },
  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    padding: '9px 20px',
    borderRadius: 10,
    fontFamily: "'IBM Plex Sans', Helvetica, Arial, sans-serif",
    fontWeight: 600,
    fontSize: 13,
    letterSpacing: '0.3px',
    cursor: 'pointer',
    border: 'none',
    boxShadow: '0 2px 10px rgba(0,0,0,0.14)',
    transition: 'transform 0.15s, box-shadow 0.15s',
  },
  printBtnPrimary: {
    background: ACCENT,
    color: '#fff',
  },
  wrapper: {
    width: 1123,
    minHeight: 794,
    margin: '56px auto 32px',
    fontFamily: "'IBM Plex Sans', Helvetica, Arial, sans-serif",
    background: '#fff',
    color: TEXT_MAIN,
    display: 'flex',
    boxSizing: 'border-box',
    boxShadow: '0 4px 40px rgba(20,18,14,0.13)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  // Single copy column
  column: (isLast) => ({
    flex: 1,
    padding: '24px 20px 18px',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    borderRight: isLast ? 'none' : `1.5px dashed ${BORDER_SUBTLE}`,
    boxSizing: 'border-box',
    minHeight: 794,
  }),

  // ── Copy badge ──
  copyBadge: {
    fontSize: 7,
    fontWeight: 700,
    letterSpacing: '1.1px',
    textTransform: 'uppercase',
    color: ACCENT,
    border: `1px solid ${ACCENT}`,
    borderRadius: 24,
    padding: '2px 9px',
    alignSelf: 'flex-end',
    marginBottom: 7,
    lineHeight: 1.6,
  },

  // ── Header ──
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: 5,
    paddingBottom: 11,
    marginBottom: 11,
    borderBottom: `2px solid ${ACCENT}`,
  },
  logoRing: {
    position: 'relative',
    width: 38,
    height: 38,
    flexShrink: 0,
  },
  logoCircle: {
    width: 38,
    height: 38,
    borderRadius: '50%',
    background: 'oklch(24% 0.03 260)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 1,
  },
  logoRingBorder: {
    position: 'absolute',
    inset: -3,
    border: `1px solid ${ACCENT}`,
    borderRadius: '50%',
    zIndex: 0,
  },
  logoText: {
    color: ACCENT,
    fontFamily: "'Playfair Display', Georgia, serif",
    fontWeight: 700,
    fontSize: 13,
    letterSpacing: '0.5px',
  },
  instituteName: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: '0.05px',
    color: '#0f0d0b',
    lineHeight: 1.2,
  },
  addressLine: {
    fontSize: 7.5,
    color: TEXT_MUTED,
    lineHeight: 1.4,
  },
  contactLine: {
    fontSize: 7.5,
    color: TEXT_MUTED,
  },
  challanTitle: {
    fontSize: 9.5,
    fontWeight: 700,
    letterSpacing: '1.6px',
    textTransform: 'uppercase',
    color: '#0f0d0b',
    marginTop: 2,
  },

  // ── Meta grid ──
  metaGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '5px 8px',
    marginBottom: 10,
  },
  metaCell: {},
  label: {
    fontSize: 7.5,
    fontWeight: 600,
    letterSpacing: '0.9px',
    textTransform: 'uppercase',
    color: TEXT_MUTED,
    display: 'block',
  },
  monoVal: {
    fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
    fontWeight: 600,
    fontSize: 9.5,
    marginTop: 1,
    display: 'block',
    color: TEXT_MAIN,
  },
  dueDateVal: {
    fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
    fontWeight: 600,
    fontSize: 9.5,
    marginTop: 1,
    display: 'block',
    color: '#c0440d',
  },

  // ── Student section ──
  studentSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
    padding: '9px 0',
    marginBottom: 10,
    borderTop: `1px solid ${BORDER_SUBTLE}`,
    borderBottom: `1px solid ${BORDER_SUBTLE}`,
  },
  studentRow: { display: 'flex', flexDirection: 'column' },
  studentVal: {
    fontWeight: 600,
    fontSize: 9.5,
    marginTop: 1,
    color: TEXT_MAIN,
  },

  // ── Fee table ──
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: 11,
  },
  thLeft: {
    textAlign: 'left',
    padding: '0 0 5px',
    fontSize: 7.5,
    fontWeight: 600,
    letterSpacing: '0.8px',
    textTransform: 'uppercase',
    color: TEXT_MUTED,
    borderBottom: `1.2px solid ${ACCENT}`,
  },
  thRight: {
    textAlign: 'right',
    padding: '0 0 5px',
    fontSize: 7.5,
    fontWeight: 600,
    letterSpacing: '0.8px',
    textTransform: 'uppercase',
    color: TEXT_MUTED,
    borderBottom: `1.2px solid ${ACCENT}`,
  },
  tdLeft: {
    padding: '4.5px 0',
    fontSize: 8.5,
    color: '#2e2620',
    borderBottom: `1px solid ${BORDER_SUBTLE}`,
  },
  tdRight: {
    padding: '4.5px 0',
    textAlign: 'right',
    fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
    fontSize: 8.5,
    fontWeight: 500,
    borderBottom: `1px solid ${BORDER_SUBTLE}`,
    color: TEXT_MAIN,
  },
  lateFeeRow: {
    fontSize: 8.5,
    color: '#c0440d',
    fontStyle: 'italic',
  },
  totalLeft: {
    padding: '7px 0 2px',
    fontFamily: "'Playfair Display', Georgia, serif",
    fontWeight: 700,
    fontSize: 10,
    color: TEXT_MAIN,
    borderTop: `1.5px solid ${ACCENT}`,
  },
  totalRight: {
    padding: '7px 0 2px',
    textAlign: 'right',
    fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
    fontWeight: 700,
    fontSize: 12,
    color: ACCENT,
    borderTop: `1.5px solid ${ACCENT}`,
  },

  // ── Bank details ──
  bankSection: { marginBottom: 10 },
  bankLabel: {
    fontSize: 7.5,
    fontWeight: 600,
    letterSpacing: '0.9px',
    textTransform: 'uppercase',
    color: ACCENT,
    marginBottom: 5,
    display: 'block',
  },
  bankBody: {
    fontSize: 7.8,
    color: '#2e2620',
    lineHeight: 1.6,
  },
  bankKey: { color: TEXT_MUTED },

  // ── Spacer ──
  spacer: { flex: 1 },

  // ── Signature ──
  sigBlock: {
    textAlign: 'center',
    marginBottom: 8,
  },
  sigLine: {
    borderTop: `1px solid ${TEXT_MUTED}`,
    paddingTop: 4,
    fontSize: 7.5,
    color: '#7a6e65',
    marginTop: 14,
    width: '70%',
    marginLeft: 'auto',
    marginRight: 'auto',
  },

  // ── Footer ──
  footer: {
    paddingTop: 7,
    borderTop: `1px solid ${BORDER_SUBTLE}`,
    fontSize: 6.5,
    color: TEXT_DIM,
    textAlign: 'center',
    lineHeight: 1.4,
  },

  // ── Late fee badge ──
  lateBadge: {
    display: 'inline-block',
    background: '#fff3e0',
    color: '#c0440d',
    borderRadius: 10,
    padding: '1px 7px',
    fontSize: 7,
    fontWeight: 700,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    marginLeft: 4,
    verticalAlign: 'middle',
  },
};

// ─────────────────────────────────────────────────────────────
//  Single Copy component
// ─────────────────────────────────────────────────────────────
const ChallanCopy = ({ label, isLast, challanData }) => {
  const {
    challanNo = 'CHL-0000-00000',
    issueDate = '',
    dueDate = '',
    studentName = '',
    registrationNo = '',
    programName = '',
    batchName = '',
    feeHeads = [],
    bankDetails = {},
    showLateFee = false,
    lateFeeAmount = 0,
    instituteName = 'Hunar Asaan Skill Center',
    instituteAddress = 'Plot 14, Tech Avenue, Gulberg III, Lahore',
    instituteContact = '+92 300 0000000 · info@hunarasaan.edu',
    showAddress = true,
  } = challanData;

  // Build the complete fee list
  const allFeeHeads = [...feeHeads];
  if (showLateFee && lateFeeAmount > 0) {
    allFeeHeads.push({ name: 'Late Payment Fee', amount: lateFeeAmount, isLateFee: true });
  }
  const total = allFeeHeads.reduce((sum, h) => sum + Number(h.amount || 0), 0);

  // Format dates
  const fmtDate = (d) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return d; }
  };

  const { bankName, accountTitle, accountNo, iban, paymentInstructions } = bankDetails;

  return (
    <div style={styles.column(isLast)}>
      {/* Copy badge */}
      <span style={styles.copyBadge}>{label}</span>

      {/* Letterhead */}
      <div style={styles.header}>
        <div style={styles.logoRing}>
          <div style={styles.logoCircle}>
            <span style={styles.logoText}>HA</span>
          </div>
          <div style={styles.logoRingBorder} />
        </div>
        <div style={styles.instituteName}>{instituteName}</div>
        {showAddress && (
          <div style={styles.addressLine}>{instituteAddress}</div>
        )}
        <div style={styles.contactLine}>{instituteContact}</div>
        <div style={styles.challanTitle}>Fee Challan</div>
      </div>

      {/* Meta Grid */}
      <div style={styles.metaGrid}>
        <div style={styles.metaCell}>
          <span style={styles.label}>Challan No.</span>
          <span style={styles.monoVal}>{challanNo}</span>
        </div>
        <div style={styles.metaCell}>
          <span style={styles.label}>Issue Date</span>
          <span style={styles.monoVal}>{fmtDate(issueDate)}</span>
        </div>
        <div style={styles.metaCell}>
          <span style={styles.label}>Due Date</span>
          <span style={styles.dueDateVal}>{fmtDate(dueDate)}</span>
        </div>
        <div style={styles.metaCell}>
          <span style={styles.label}>Batch</span>
          <span style={styles.monoVal}>{batchName || '—'}</span>
        </div>
      </div>

      {/* Student Info */}
      <div style={styles.studentSection}>
        <div style={styles.studentRow}>
          <span style={styles.label}>Student Name</span>
          <span style={styles.studentVal}>{studentName || '—'}</span>
        </div>
        {registrationNo && (
          <div style={styles.studentRow}>
            <span style={styles.label}>Registration No.</span>
            <span style={{ ...styles.monoVal, ...styles.studentVal }}>{registrationNo}</span>
          </div>
        )}
        <div style={styles.studentRow}>
          <span style={styles.label}>Program</span>
          <span style={styles.studentVal}>{programName || '—'}</span>
        </div>
      </div>

      {/* Fee Table */}
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.thLeft}>Fee Head</th>
            <th style={styles.thRight}>PKR</th>
          </tr>
        </thead>
        <tbody>
          {allFeeHeads.map((head, i) => (
            <tr key={i}>
              <td style={{ ...styles.tdLeft, ...(head.isLateFee ? styles.lateFeeRow : {}) }}>
                {head.name}
                {head.isLateFee && <span style={styles.lateBadge}>Late</span>}
              </td>
              <td style={{ ...styles.tdRight, ...(head.isLateFee ? { color: '#c0440d' } : {}) }}>
                {fmt(head.amount)}
              </td>
            </tr>
          ))}
          <tr>
            <td style={styles.totalLeft}>Total Payable</td>
            <td style={styles.totalRight}>{fmt(total)}</td>
          </tr>
        </tbody>
      </table>

      {/* Bank Details */}
      {(bankName || accountTitle || accountNo || iban) && (
        <div style={styles.bankSection}>
          <span style={styles.bankLabel}>Bank Transfer Details</span>
          <div style={styles.bankBody}>
            {bankName && (
              <div>
                <span style={styles.bankKey}>Bank: </span>
                <b>{bankName}</b>
              </div>
            )}
            {accountTitle && (
              <div>
                <span style={styles.bankKey}>A/C Title: </span>
                <b>{accountTitle}</b>
              </div>
            )}
            {accountNo && (
              <div>
                <span style={styles.bankKey}>A/C No.: </span>
                <b style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{accountNo}</b>
              </div>
            )}
            {iban && (
              <div>
                <span style={styles.bankKey}>IBAN: </span>
                <b style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{iban}</b>
              </div>
            )}
            {paymentInstructions && (
              <div style={{ marginTop: 4, fontStyle: 'italic', color: '#4b5563', fontSize: 7 }}>
                Note: {paymentInstructions}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Spacer pushes footer down */}
      <div style={styles.spacer} />

      {/* Signature */}
      <div style={styles.sigBlock}>
        <div style={styles.sigLine}>Authorized Signature</div>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        Fee once deposited is non-refundable · Retain this challan for records
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  Print styles injected into <head> once
// ─────────────────────────────────────────────────────────────
const PRINT_STYLE_ID = 'fee-challan-print-styles';
if (typeof document !== 'undefined' && !document.getElementById(PRINT_STYLE_ID)) {
  const style = document.createElement('style');
  style.id = PRINT_STYLE_ID;
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');
    @media print {
      body * { visibility: hidden !important; }
      #fee-challan-root, #fee-challan-root * { visibility: visible !important; }
      #fee-challan-root { position: fixed !important; top: 0; left: 0; width: 100vw; z-index: 99999; }
      .fee-challan-no-print { display: none !important; }
      @page { size: A4 landscape; margin: 0; }
    }
  `;
  document.head.appendChild(style);
}

// ─────────────────────────────────────────────────────────────
//  Main exported component
// ─────────────────────────────────────────────────────────────

/**
 * FeeChallan – Tri-plicate A4 Landscape fee challan component.
 *
 * @param {object} challanData – All dynamic data for the challan.
 *   @param {string} challanData.challanNo
 *   @param {string} challanData.issueDate       – ISO date or readable string
 *   @param {string} challanData.dueDate         – ISO date or readable string
 *   @param {string} challanData.studentName
 *   @param {string} challanData.registrationNo
 *   @param {string} challanData.programName
 *   @param {string} challanData.batchName
 *   @param {Array}  challanData.feeHeads        – [{ name, amount }]
 *   @param {object} challanData.bankDetails     – { bankName, accountTitle, accountNo, iban }
 *   @param {boolean} challanData.showLateFee
 *   @param {number}  challanData.lateFeeAmount
 *   @param {string}  challanData.instituteName  – Optional override
 *   @param {string}  challanData.instituteAddress
 *   @param {string}  challanData.instituteContact
 *   @param {boolean} challanData.showAddress    – default true
 * @param {boolean} copies – if false, shows only Student Copy; true = all 3 (default: true)
 */
const FeeChallan = ({ challanData = {}, copies = true }) => {
  const containerRef = useRef(null);

  const handlePrint = () => {
    window.print();
  };

  const copyLabels = copies
    ? COPY_LABELS
    : ['Student Copy'];

  return (
    <>
      {/* ── Floating toolbar (hidden on print) ── */}
      <div className="fee-challan-no-print" style={styles.printBtn}>
        <button
          onClick={handlePrint}
          style={{ ...styles.btn, ...styles.printBtnPrimary }}
          onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.22)'; }}
          onMouseOut={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = styles.btn.boxShadow; }}
          title="Print Challan (Ctrl+P)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          Print Challan
        </button>
      </div>

      {/* ── Challan Sheet ── */}
      <div id="fee-challan-root" ref={containerRef} style={styles.wrapper}>
        {copyLabels.map((label, i) => (
          <ChallanCopy
            key={label}
            label={label}
            isLast={i === copyLabels.length - 1}
            challanData={challanData}
          />
        ))}
      </div>
    </>
  );
};

export default FeeChallan;
