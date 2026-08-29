import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import FeeChallan from '../components/FeeChallan';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────
const formatChallanNo = (id) => {
    const pad = String(id || 0).padStart(5, '0');
    const year = new Date().getFullYear();
    return `HA-${year}-${pad}`;
};

const getDueDate = (issueDate, daysOut = 15) => {
    const d = new Date(issueDate || Date.now());
    d.setDate(d.getDate() + daysOut);
    return d.toISOString();
};

const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const getFullUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    return `${backendUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

// Fixed institute bank details — update once in Settings if needed
const INSTITUTE_BANK = {
    bankName: 'Meezan Bank Ltd., Gulberg Branch',
    accountTitle: 'Hunar Asaan Skill Center',
    accountNo: '0110-1234567-001',
    iban: 'PK36 MEZN 0001 1012 3456 7001',
};

// ─────────────────────────────────────────────────────────────
//  FeeChallanPage — fetches real data and wires FeeChallan
// ─────────────────────────────────────────────────────────────
const FeeChallanPage = () => {
    const { user, api, settings } = useApp();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [challanData, setChallanData] = useState(null);

    // Controls
    const [showLateFee, setShowLateFee] = useState(false);
    const [lateFeeAmount, setLateFeeAmount] = useState(500);
    const [copies, setCopies] = useState(true); // true = 3 copies

    useEffect(() => {
        const fetchChallanData = async () => {
            try {
                setLoading(true);
                setError(null);

                // ── 1. Find the student record matching the logged-in user or requested query ──
                const queryParams = new URLSearchParams(window.location.search);
                const urlStudentId = queryParams.get('studentId');

                let student = null;
                if (urlStudentId && (user?.role === 'Admin' || user?.role === 'Manager' || user?.role === 'accounts_manager')) {
                    const res = await api.getStudentById(urlStudentId);
                    student = res?.student || res;
                } else if (user?.role === 'Admin' || user?.role === 'Manager' || user?.role === 'accounts_manager') {
                    student = {
                        id: 'TEMPLATE',
                        name: 'Student Name (Placeholder)',
                        email: user.email,
                        programName: 'Program Name (Placeholder)',
                        batchName: 'Batch (Placeholder)',
                        totalFee: 0,
                        discount: 0
                    };
                } else {
                    const allStudents = await api.getStudents();
                    student = Array.isArray(allStudents)
                        ? allStudents.find(s => s?.email?.toLowerCase() === user?.email?.toLowerCase())
                        : null;
                }

                if (!student) {
                    setError('No student profile found.');
                    return;
                }

                const sid = student.id || student._id;

                // ── 2. Fetch full details & payments in parallel (skip for Admin template) ──
                let details = { status: 'rejected' };
                let paymentsRes = { status: 'rejected' };
                let balanceRes = { status: 'rejected' };

                if (sid !== 'TEMPLATE') {
                    [details, paymentsRes, balanceRes] = await Promise.allSettled([
                        api.getStudentById(sid),
                        api.getPaymentsByStudent(sid),
                        api.getRemainingBalance(sid),
                    ]);
                }

                const studentFull =
                    details.status === 'fulfilled' ? (details.value?.student || details.value) : student;

                const payments =
                    paymentsRes.status === 'fulfilled'
                        ? paymentsRes.value?.payments || paymentsRes.value || []
                        : [];

                const balance =
                    balanceRes.status === 'fulfilled'
                        ? Number(balanceRes.value?.balance ?? balanceRes.value?.remainingBalance ?? 0)
                        : 0;

                const enrollments = details.status === 'fulfilled' ? details.value?.enrollments || [] : [];

                // ── 3. Calculate fee heads ──
                const totalFee = Number(studentFull.totalFee || 0);
                const discount = Number(studentFull.discount || 0);
                const netFee = Math.max(0, totalFee - discount);
                const totalInstallments = Number(studentFull.totalInstallments || 1);

                const baseInstallment = Math.round(netFee / Math.max(1, totalInstallments));

                const feeHeads = [
                    { name: studentFull.Course?.name || studentFull.programName || 'Skills Training Program', amount: netFee }
                ];

                if (payments.length > 0) {
                    payments.forEach((p) => {
                        if (p.status === 'Paid') {
                            const pDate = p.paymentDate
                                ? new Date(p.paymentDate).toLocaleDateString('en-PK', { day: '2-digit', month: '2-digit', year: '2-digit' })
                                : '';
                            feeHeads.push({
                                name: `Paid: Inst ${p.installmentNumber || ''} (${pDate})`,
                                amount: -Math.abs(Number(p.amountPaid || 0)),
                                isCredit: true,
                            });
                        }
                    });
                }

                const programName =
                    studentFull.Course?.name ||
                    studentFull.programName ||
                    'Skills Training Course';

                const batchName =
                    studentFull.Batch?.name ||
                    studentFull.batchName ||
                    '—';

                // ── 5. Issue & due date ──
                const issueDate = new Date().toISOString();
                const dueDate = getDueDate(issueDate, 15);

                // ── 6. Challan number (use latest payment receipt or auto-generate) ──
                const latestPayment = [...payments].sort(
                    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                )[0];
                const challanNo = formatChallanNo(latestPayment?.id || sid);

                setChallanData({
                    challanNo,
                    issueDate,
                    dueDate,
                    studentName: studentFull.name || user?.name || '—',
                    registrationNo: String(sid),
                    programName,
                    batchName,
                    feeHeads,
                    bankDetails: {
                        bankName: settings?.bankName || INSTITUTE_BANK.bankName,
                        accountTitle: settings?.accountTitle || INSTITUTE_BANK.accountTitle,
                        accountNo: settings?.accountNo || INSTITUTE_BANK.accountNo,
                        iban: settings?.ibanCode || INSTITUTE_BANK.iban,
                        paymentInstructions: settings?.paymentInstructions || ''
                    },
                    showLateFee,
                    lateFeeAmount,
                    logoUrl: getFullUrl(settings?.logoUrl),
                    instituteName: settings?.instituteName || 'Hunar Asaan Skill Center',
                    instituteAddress: settings?.address || 'DHA PHASE 6 LAHORE, PAKISTAN.',
                    officialEmail: settings?.officialEmail || 'info@hunarasaan.edu',
                    officialWebsite: settings?.officialWebsite || 'hunarasaan.edu',
                    instituteContact: `${settings?.contact || '+92 3231218000'} · ${settings?.officialEmail || 'info@hunarasaan.edu'} · ${settings?.officialWebsite || 'hunarasaan.edu'}`,
                    showAddress: true,
                    signatureUrl: getFullUrl(settings?.signatureUrl || settings?.authorizedSignatureUrl),
                    authorizedSignatureUrl: getFullUrl(settings?.signatureUrl || settings?.authorizedSignatureUrl),
                    signatureTitle: settings?.signatureTitle || 'Authorized Signature',
                });
            } catch (err) {
                console.error('FeeChallanPage: fetch failed', err);
                setError('Failed to load challan data. Please try again.');
                toast.error('Could not load your fee challan.');
            } finally {
                setLoading(false);
            }
        };

        if (user?.email) fetchChallanData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, settings]);

    // Re-sync late fee flags into challanData without re-fetching
    useEffect(() => {
        if (!challanData) return;
        setChallanData(prev => ({ ...prev, showLateFee, lateFeeAmount }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showLateFee, lateFeeAmount]);

    // ─── Loading ───────────────────────────────────────────────
    if (loading) {
        return (
            <div style={{
                minHeight: '60vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 14,
                fontFamily: "'IBM Plex Sans', sans-serif",
            }}>
                <div style={{
                    width: 36, height: 36,
                    border: '3px solid #ede8df',
                    borderTopColor: '#8a6a2f',
                    borderRadius: '50%',
                    animation: 'spin 0.75s linear infinite',
                }} />
                <p style={{ fontSize: 13, color: '#7a6e65', margin: 0 }}>
                    Preparing your fee challan…
                </p>
                <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
        );
    }

    // ─── Error ────────────────────────────────────────────────
    if (error) {
        return (
            <div style={{
                minHeight: '40vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                fontFamily: "'IBM Plex Sans', sans-serif",
            }}>
                <div style={{ fontSize: 32 }}>⚠️</div>
                <p style={{ fontSize: 14, color: '#c0440d', fontWeight: 600 }}>{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    style={{
                        padding: '8px 20px', background: '#8a6a2f', color: '#fff',
                        border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer',
                        fontSize: 13,
                    }}
                >
                    Retry
                </button>
            </div>
        );
    }

    // ─── Rendered challan ──────────────────────────────────────
    return (
        <div style={{ background: 'oklch(95% 0.005 80)', minHeight: '100vh', paddingBottom: 48 }}>

            {/* ── Top Toolbar ── */}
            <div className="fee-challan-no-print" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 32px',
                background: '#fff',
                borderBottom: '1px solid #ede8df',
                fontFamily: "'IBM Plex Sans', sans-serif",
                gap: 16,
                flexWrap: 'wrap',
            }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#1a1512' }}>
                        Fee Challan
                    </h2>
                    <p style={{ margin: 0, fontSize: 12, color: '#7a6e65', marginTop: 2 }}>
                        {challanData?.challanNo}
                    </p>
                </div>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Late fee toggle */}
                    <label style={{
                        display: 'flex', alignItems: 'center', gap: 7,
                        fontSize: 12, fontWeight: 600, color: '#5a4e46',
                        cursor: 'pointer', userSelect: 'none',
                    }}>
                        <input
                            type="checkbox"
                            checked={showLateFee}
                            onChange={e => setShowLateFee(e.target.checked)}
                            style={{ accentColor: '#8a6a2f', width: 14, height: 14 }}
                        />
                        Include Late Fee
                    </label>

                    {showLateFee && (
                        <input
                            type="number"
                            min={0}
                            value={lateFeeAmount}
                            onChange={e => setLateFeeAmount(Number(e.target.value))}
                            style={{
                                width: 90, padding: '5px 8px', border: '1px solid #ede8df',
                                borderRadius: 7, fontSize: 12, fontFamily: 'inherit',
                                color: '#c0440d', fontWeight: 600,
                            }}
                            placeholder="Late fee"
                        />
                    )}

                    {/* Copies toggle */}
                    <label style={{
                        display: 'flex', alignItems: 'center', gap: 7,
                        fontSize: 12, fontWeight: 600, color: '#5a4e46',
                        cursor: 'pointer', userSelect: 'none',
                    }}>
                        <input
                            type="checkbox"
                            checked={copies}
                            onChange={e => setCopies(e.target.checked)}
                            style={{ accentColor: '#8a6a2f', width: 14, height: 14 }}
                        />
                        Tri-plicate (3 copies)
                    </label>
                </div>
            </div>

            {/* ── Challan ── */}
            {challanData && (
                <FeeChallan challanData={challanData} copies={copies} />
            )}
        </div>
    );
};

export default FeeChallanPage;
