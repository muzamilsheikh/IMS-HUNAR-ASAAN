import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import generateReceipt from '../../utils/generateReceipt';
import {
    Download, Shield, CheckCircle, Clock, AlertTriangle, Phone,
    Calendar as CalendarIcon, User, Layers, Hash, Edit3, Save, X, Trash2,
    Briefcase, ArrowRight, ChevronRight, CreditCard, DollarSign, Printer,
    CopyCheck, TrendingDown, Wallet, Banknote, Tag, Percent, Calculator,
    Eye, EyeOff, FileText
} from 'lucide-react';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import apiClient from '../../utils/api';
import toast from 'react-hot-toast';
import Modal from '../layout/Modal';
import { 
    GraduationCap, 
    Trophy, 
    Activity, 
    TrendingUp, 
    PlusCircle,
    Search as SearchIcon,
    Sparkles,
    Check,
    BookOpen
} from 'lucide-react';

// Register a basic font for PDF
Font.register({
    family: 'Helvetica-Bold',
    src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica@1.0.4/Helvetica-Bold.ttf'
});

const styles = StyleSheet.create({
    page: { padding: 40, backgroundColor: '#ffffff', fontFamily: 'Helvetica' },
    header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40, borderBottom: 2, borderBottomColor: '#1e3a8a', paddingBottom: 20 },
    logoSection: { flexDirection: 'column' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: 1 },
    subtitle: { fontSize: 10, color: '#64748b', marginTop: 4, fontWeight: 'bold' },
    voucherInfo: { alignItems: 'right' },
    voucherLabel: { fontSize: 10, color: '#64748b', textTransform: 'uppercase' },
    voucherId: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
    section: { marginBottom: 30 },
    sectionTitle: { fontSize: 10, fontWeight: 'bold', color: '#1e3a8a', textTransform: 'uppercase', marginBottom: 10, borderBottom: 1, borderBottomColor: '#e2e8f0', paddingBottom: 5 },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    gridItem: { width: '50%', marginBottom: 15 },
    label: { fontSize: 9, color: '#64748b', textTransform: 'uppercase', marginBottom: 2 },
    value: { fontSize: 11, fontWeight: 'bold', color: '#0f172a' },
    table: { marginTop: 20 },
    tableHeader: { flexDirection: 'row', backgroundColor: '#f8fafc', padding: 10, borderBottom: 1, borderBottomColor: '#e2e8f0' },
    tableRow: { flexDirection: 'row', padding: 10, borderBottom: 1, borderBottomColor: '#f1f5f9' },
    col1: { width: '25%', fontSize: 10, fontWeight: 'bold' },
    col2: { width: '25%', fontSize: 10, textAlign: 'center' },
    col3: { width: '25%', fontSize: 10, textAlign: 'center' },
    col4: { width: '25%', fontSize: 10, textAlign: 'right', fontWeight: 'bold' },
    footer: { marginTop: 50, borderTop: 1, borderTopColor: '#e2e8f0', paddingTop: 20, textAlign: 'center' },
    footerText: { fontSize: 8, color: '#94a3b8' },
    paidStamp: { position: 'absolute', top: 150, right: 50, border: 3, borderColor: '#10b981', color: '#10b981', padding: 10, fontSize: 30, fontWeight: 'bold', borderRadius: 10, opacity: 0.2, transform: 'rotate(-15deg)' }
});

// Payment Receipt PDF
const PaymentReceipt = ({ payment, student, settings }) => {
    const logoUrl = getFullLogoUrl(settings?.logoUrl);
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <View style={styles.logoSection}>
                        {logoUrl && (
                            <Image 
                                src={logoUrl} 
                                style={{ width: 45, height: 45, marginBottom: 8 }} 
                            />
                        )}
                        <Text style={styles.title}>{settings?.instituteName || 'Hunar Asaan'}</Text>
                    <Text style={styles.subtitle}>Professional Skills Training Center</Text>
                </View>
                <View style={styles.voucherInfo}>
                    <Text style={styles.voucherLabel}>Payment Receipt</Text>
                    <Text style={styles.voucherId}>Receipt #{payment?.receiptNo}</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Student Information</Text>
                <View style={styles.grid}>
                    <View style={styles.gridItem}>
                        <Text style={styles.label}>Student Name</Text>
                        <Text style={styles.value}>{student?.name || 'N/A'}</Text>
                    </View>
                    <View style={styles.gridItem}>
                        <Text style={styles.label}>Student ID</Text>
                        <Text style={styles.value}>{student?.id || 'N/A'}</Text>
                    </View>
                    <View style={styles.gridItem}>
                        <Text style={styles.label}>Contact Number</Text>
                        <Text style={styles.value}>{student?.phone || 'N/A'}</Text>
                    </View>
                    <View style={styles.gridItem}>
                        <Text style={styles.label}>Email</Text>
                        <Text style={styles.value}>{student?.email || 'N/A'}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Payment Details</Text>
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={styles.col1}>Field</Text>
                        <Text style={styles.col2}>Value</Text>
                    </View>
                    <View style={styles.tableRow}>
                        <Text style={styles.col1}>Amount Paid (Net)</Text>
                        <Text style={styles.col2}>PKR {payment?.amountPaid?.toLocaleString()}</Text>
                    </View>
                    <View style={styles.tableRow}>
                        <Text style={styles.col1}>Discount Applied</Text>
                        <Text style={styles.col2}>PKR {payment?.discount?.toLocaleString() || '0'}</Text>
                    </View>
                    <View style={styles.tableRow}>
                        <Text style={styles.col1}>Payment Method</Text>
                        <Text style={styles.col2}>{payment?.paymentMethod}</Text>
                    </View>
                    <View style={styles.tableRow}>
                        <Text style={styles.col1}>Payment Date</Text>
                        <Text style={styles.col2}>{new Date(payment?.paymentDate).toLocaleDateString()}</Text>
                    </View>
                    {payment?.transactionId && (
                        <View style={styles.tableRow}>
                            <Text style={styles.col1}>Transaction ID</Text>
                            <Text style={styles.col2}>{payment?.transactionId}</Text>
                        </View>
                    )}
                </View>
            </View>

            <View style={styles.section}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, padding: 15, backgroundColor: '#f8fafc', borderRadius: 8 }}>
                    <View>
                        <Text style={{ fontSize: 9, color: '#64748b', marginBottom: 5 }}>Current Balance:</Text>
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#0f172a' }}>PKR {payment?.remainingBalance?.toLocaleString()}</Text>
                    </View>
                    <View>
                        <Text style={{ fontSize: 9, color: '#64748b', marginBottom: 5 }}>Total Discount:</Text>
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#e11d48' }}>PKR {student?.discount?.toLocaleString() || '0'}</Text>
                    </View>
                    <View>
                        <Text style={{ fontSize: 9, color: '#64748b', marginBottom: 5 }}>Total Paid:</Text>
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#10b981' }}>PKR {student?.totalPaid?.toLocaleString()}</Text>
                    </View>
                    <View>
                        <Text style={{ fontSize: 9, color: '#64748b', marginBottom: 5 }}>Base Tuition:</Text>
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#0f172a' }}>PKR {student?.totalFee?.toLocaleString() || '0'}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>{settings?.address || 'Hunar Asaan Training Center'}</Text>
                <Text style={styles.footerText}>Phone: {settings?.contact || '+92 300 1234567'} | Web: hunarasaan.com</Text>
                <Text style={[styles.footerText, { marginTop: 10, fontStyle: 'italic' }]}>This is a system-generated document and is valid without signature.</Text>
            </View>
        </Page>
    </Document>
    );
};

// Toast Notification Component
const Toast = ({ message, type = 'success', onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            className={cn(
                'fixed bottom-4 right-4 px-6 py-3 rounded-lg text-white font-bold text-sm shadow-lg z-50',
                type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-rose-500' : 'bg-sky-500'
            )}
        >
            {message}
        </motion.div>
    );
};

// Helper function to convert relative logo URL to absolute URL for PDF rendering
const getFullLogoUrl = (logoUrl) => {
    if (!logoUrl) return null;
    // If it's already an absolute URL, return as is
    if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) {
        return logoUrl;
    }
    // If it's a relative path, construct full URL
    if (logoUrl.startsWith('/')) {
        const backendUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:5001'
            : window.location.origin;
        return `${backendUrl}${logoUrl}`;
    }
    return logoUrl;
};

const StudentLedger = ({ studentId, onUpdate }) => {
    const { students, settings, api, courses, batches, refreshFinancialStats } = useApp();
    const contextStudent = students?.find(s => (s?._id === studentId || s?.id === studentId));
    
    // Use local state to ensure latest student data is displayed
    const [localStudent, setLocalStudent] = useState(null);
    const student = localStudent || contextStudent; // Prefer local state if available

    // Password reset states
    const [showPasswordReset, setShowPasswordReset] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!newPassword || newPassword.trim().length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }
        setIsResettingPassword(true);
        try {
            const studentIdParam = `student_${student.id || student._id}`;
            await apiClient.resetUserPassword(studentIdParam, { newPassword });
            toast.success(`Password for ${student.name} reset successfully!`);
            setShowPasswordReset(false);
            setNewPassword('');
            setShowPassword(false);
        } catch (error) {
            console.error('Failed to reset password:', error);
            toast.error(error.response?.data?.error || 'Failed to reset password');
        } finally {
            setIsResettingPassword(false);
        }
    };

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentDiscount, setPaymentDiscount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [transactionId, setTransactionId] = useState('');
    const [selectedEnrollmentForPayment, setSelectedEnrollmentForPayment] = useState(null);
    const [isFullPay, setIsFullPay] = useState(false);
    const [loading, setLoading] = useState(false);
    const [payments, setPayments] = useState([]);
    const [slipFile, setSlipFile] = useState(null);
    const [balance, setBalance] = useState(0);
    const [totalPaid, setTotalPaid] = useState(0); // ✅ NEW: Track total paid from payments
    const [toastMessage, setToastMessage] = useState(null);
    const [toastType, setToastType] = useState('success');
    
    // NEW: Enrollments state
    const [enrollments, setEnrollments] = useState([]);
    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [enrollCourseId, setEnrollCourseId] = useState('');
    const [enrollBatchId, setEnrollBatchId] = useState('');
    const [enrolling, setEnrolling] = useState(false);
    const [showSuccessAnim, setShowSuccessAnim] = useState(false);

    // NEW: Financial State for Enrollment
    const [enrollDiscount, setEnrollDiscount] = useState(0);
    const [enrollInstallments, setEnrollInstallments] = useState(false);
    const [enrollMonths, setEnrollMonths] = useState(3);
    const [enrollDownPayment, setEnrollDownPayment] = useState(0);
    const [selectedCourseObj, setSelectedCourseObj] = useState(null);
    const [pendingEnrollmentToApprove, setPendingEnrollmentToApprove] = useState(null);

    // ── Print Receipt (premium tri-plicate A4 landscape) ───────────────────────────
    const handlePrintReceipt = (payment) => {
        try {
            if (!student) {
                toast.error('Student profile not loaded yet. Please wait and try again.');
                return;
            }

            // ── Resolve course name from richest available source ──
            const courseName =
                payment?.Enrollment?.Course?.name ||
                payment?.course ||
                student?.Course?.name ||
                enrollments?.[0]?.Course?.name ||
                'N/A';

            // ── Resolve remaining balance ──────────────────────────
            // Prefer the value stored on this specific payment record;
            // fall back to the live `balance` state kept in sync by fetchPayments.
            const remainingBalance =
                payment?.remainingBalance !== undefined && payment?.remainingBalance !== null
                    ? Number(payment.remainingBalance)
                    : Number(balance ?? 0);

            // ── Build the paymentData payload ──────────────────────
            const data = {
                studentName : student?.name                            || '—',
                studentId   : String(student?.id || student?._id      || '—'),
                course      : courseName,
                amount      : Number(payment?.amountPaid              || 0),
                balance     : remainingBalance,
                method      : payment?.paymentMethod                  || 'Cash',
                date        : payment?.paymentDate || payment?.createdAt || new Date().toISOString(),
                receiptNo   : payment?.receiptNo                      || `RCP-${payment?.id || Date.now()}`,
            };

            generateReceipt(data, 'PAID', settings);
        } catch (err) {
            console.error('handlePrintReceipt error:', err);
            toast.error('Could not generate receipt. Please try again.');
        }
    };

    // Initialize local student from context
    useEffect(() => {
        if (contextStudent) {
            setLocalStudent(contextStudent);
        }
    }, [contextStudent?.id]);

    // Fetch payments and balance on mount
    useEffect(() => {
       if (student?.id) {
           fetchPayments();
            // No need to fetch balance separately - it comes with payments
           fetchStudentDetails();
        }
    }, [student?.id]);

   const fetchPayments = async() => {
       try {
           const response = await apiClient.getPaymentsByStudent(student?.id);
           const paymentsData = response?.payments || [];
           setPayments(paymentsData);
            
            // ✅ CRITICAL FIX: Calculate totalPaid by summing payments array
           const totalPaidFromPayments = paymentsData.reduce((acc, curr) => acc + Number(curr.amountPaid || 0), 0);
           setTotalPaid(totalPaidFromPayments);
            
            // Calculate remaining balance using the summary from backend
           const summary = response?.summary;
           if (summary) {
               setBalance(summary.remainingBalance || 0);
            } else {
                // Fallback calculation
               const originalFee = student?.totalFee || 0;
               const discount = student?.discount || 0;
               const calculatedBalance = originalFee - discount - totalPaidFromPayments;
               setBalance(calculatedBalance);
            }
        } catch (err) {
           console.error('Error fetching payments:', err);
            toast.error('Failed to load payment history');
        }
    };

    // CRITICAL: Refetch student details to get updated totalPaid and balance
    const fetchStudentDetails = async () => {
        try {
            const response = await apiClient.getStudentById(student?.id);
            if (response && response.student) {
                // Update local state with fresh data from backend
                setLocalStudent(response.student);
                // Also update balance from fresh data
                const freshBalance = (response.student.totalFee || 0) - (response.student.discount || 0) - (response.student.totalPaid || 0);
                setBalance(freshBalance);
                
                // Update enrollments
                setEnrollments(response.enrollments || []);
            }
        } catch (err) {
            console.error('Error fetching student details:', err);
        }
    };

    const showToast = (message, type = 'success') => {
        setToastMessage(message);
        setToastType(type);
    };

    // 🔥 NEW: Smart Fee Calculation Helpers
    const calculateRemainingBalance = () => {
        if (selectedEnrollmentForPayment) {
            const paid = selectedEnrollmentForPayment.Payments?.reduce((sum, p) => sum + parseFloat(p.amountPaid || 0), 0) || 0;
            return Math.max(0, parseFloat(selectedEnrollmentForPayment.totalFee || 0) - parseFloat(selectedEnrollmentForPayment.discount || 0) - paid);
        }
        return currentRemainingBalance;
    };

    const handlePayFull = () => {
        const balance = calculateRemainingBalance();
        setPaymentAmount(balance.toString());
        toast.success(`Auto-filled: Rs. ${balance.toLocaleString()} (Full Balance)`);
    };

    const handlePayHalf = () => {
        const balance = calculateRemainingBalance();
        const halfAmount = Math.floor(balance / 2);
        setPaymentAmount(halfAmount.toString());
        toast.success(`Auto-filled: Rs. ${halfAmount.toLocaleString()} (50% of Balance)`);
    };

    const handleCustomAmount = () => {
        setPaymentAmount('');
        // Focus will be on input automatically
    };

    const handlePaymentSubmit = async () => {
        const totalToPay = parseFloat(paymentAmount || 0);
        const discVal = parseFloat(paymentDiscount || 0);
        const netPaid = totalToPay - discVal;

        // Validation 1: Check amount is valid
        if (totalToPay <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        if (netPaid <= 0) {
            toast.error('Net payment amount (Total - Discount) must be greater than zero');
            return;
        }

        // Validation 2: Check enrollment is selected (if enrollments exist)
        if (enrollments?.length > 0 && !selectedEnrollmentForPayment) {
            toast.error('Please select a course to apply payment');
            return;
        }

        // Validation 3: Check amount doesn't exceed remaining balance
        const remainingBalance = calculateRemainingBalance();
        if (totalToPay > remainingBalance) {
            toast.error(`Cannot exceed remaining balance of Rs. ${remainingBalance.toLocaleString()}`);
            return;
        }

        // Validation 4: Transaction ID required for non-cash payments
        if (paymentMethod !== 'Cash' && !transactionId) {
            toast.error('Transaction ID is required for Online/Bank payments');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('studentId', student?.id);
            if (selectedEnrollmentForPayment?.id) {
                formData.append('enrollmentId', selectedEnrollmentForPayment.id);
            }
            formData.append('amountPaid', netPaid);
            formData.append('discount', discVal);
            formData.append('paymentMethod', paymentMethod);
            if (transactionId) {
                formData.append('transactionId', transactionId);
            }
            if (slipFile) {
                formData.append('slip', slipFile);
            }

            const response = await apiClient.createPayment(formData);

            if (response?.success) {
                toast.success(`Payment of Rs. ${netPaid.toLocaleString()} received (Discount: Rs. ${discVal.toLocaleString()})! Receipt: ${response?.receiptNo}`);
                setPaymentAmount('');
                setPaymentDiscount('');
                setTransactionId('');
                setPaymentMethod('Cash');
                setIsFullPay(false);
                setSlipFile(null);
                setShowPaymentModal(false);
                
                // 🔥 CRITICAL: Refresh ALL data immediately - in this specific order
                // 1. Refetch and update student details (includes totalPaid)
                await fetchStudentDetails();
                // 2. Refetch payment history
                await fetchPayments();
                // 3. Refresh financial stats for dashboard
                await refreshFinancialStats();
                // 4. Call parent update callback
                onUpdate?.();
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Payment failed');
        } finally {
            setLoading(false);
        }
    };

    const getPaymentMethodIcon = (method) => {
        if (method === 'Bank') return <Banknote size={16} />;
        if (method === 'Online') return <Wallet size={16} />;
        return <DollarSign size={16} />;
    };

    const getPaymentMethodColor = (method) => {
        if (method === 'Bank') return 'bg-blue-50 text-blue-600';
        if (method === 'Online') return 'bg-purple-50 text-purple-600';
        return 'bg-emerald-50 text-emerald-600';
    };

    if (!student) return null;

    // ✅ CRITICAL FIX: Use totalPaid state(calculated from payments) instead of student.totalPaid
  const originalFee = student?.totalFee || 0;        // Shows 30,000 (original course fee)
  const discount = student?.discount || 0;            // Shows 5,000 (scholarship)
  const netPayable = originalFee - discount;          // Shows 25,000 (net payable)
  const currentRemainingBalance = netPayable - totalPaid; // ✅ Use calculated totalPaid state
   
    // 🔥 NEW: Check if payment is overdue
  const today = new Date();
  const nextDueDate = student?.next_due_date ? new Date(student.next_due_date) : null;
  const isOverdue = nextDueDate && nextDueDate < today && currentRemainingBalance > 0;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
            {toastMessage && (
                <Toast
                    message={toastMessage}
                    type={toastType}
                    onClose={() => setToastMessage(null)}
                />
            )}

            {/* Header with Student Info */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-xl border border-slate-100 gap-4 sm:gap-6">
                <div className="flex items-start sm:items-center gap-4 sm:gap-6 flex-col sm:flex-row w-full sm:w-auto">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary rounded-2xl sm:rounded-3xl flex items-center justify-center font-black text-2xl sm:text-3xl text-secondary shadow-lg flex-shrink-0">
                        {student?.name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-2 sm:mb-1">
                            <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tighter uppercase">{student?.name || 'Student'}</h2>
                            <span className={cn(
                                "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                                student?.status === 'Active' ? 'bg-emerald-50 text-emerald-600' :
                                    student?.status === 'Completed' ? 'bg-secondary/10 text-secondary' : 'bg-rose-50 text-rose-600'
                            )}>
                                {student?.status || 'Unknown'}
                            </span>
                            {/* 🔥 NEW: Overdue Badge */}
                            {isOverdue && (
                                <motion.span 
                                    className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-red-50 text-red-600 border border-red-300 animate-pulse"
                                    animate={{ opacity: [1, 0.6, 1] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                >
                                    🔴 OVERDUE
                                </motion.span>
                            )}
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-slate-400 text-xs">
                            <div className="flex items-center gap-2"><Hash size={14} className="text-secondary flex-shrink-0" /><span className="font-bold uppercase tracking-widest">{student?.id || 'N/A'}</span></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-200 hidden sm:block" />
                            <div className="flex items-center gap-2"><Phone size={14} className="text-secondary flex-shrink-0" /><span className="font-bold uppercase tracking-widest">{student?.phone || 'NO CONTACT'}</span></div>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                    <button 
                        onClick={() => setShowPasswordReset(true)}
                        className="group bg-blue-50 hover:bg-blue-100 text-blue-600 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all border border-blue-100 shadow-sm active:scale-95"
                    >
                        <Shield size={18} className="text-blue-500 group-hover:scale-110 transition-transform" />
                        Reset Password
                    </button>
                    <button 
                        onClick={() => window.open(`/fee-challan?studentId=${student?.id}`, '_blank')}
                        className="group bg-emerald-50 hover:bg-emerald-100 text-emerald-600 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all border border-emerald-100 shadow-sm active:scale-95"
                    >
                        <FileText size={18} className="text-emerald-500 group-hover:scale-110 transition-transform" />
                        Print Fee Challan
                    </button>
                    <button 
                        onClick={() => setShowEnrollModal(true)}
                        className="group bg-slate-800 hover:bg-black text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-4 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 active:scale-95"
                    >
                        <PlusCircle size={18} className="text-primary group-hover:rotate-90 transition-all duration-500" />
                        Quick Enroll
                    </button>
                </div>
            </div>

            {/* 🔥 NEW: Learning Journey Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tighter uppercase flex items-center gap-3">
                            <GraduationCap className="text-secondary" />
                            Learning Journey
                        </h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 opacity-60">
                            Academic Progress & Enrollments
                        </p>
                    </div>
                    <div className="bg-slate-100 px-4 py-2 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        {enrollments.length} Course(s)
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {enrollments.map((enr, idx) => {
                            const enrPaid = enr.Payments?.reduce((sum, p) => sum + p.amountPaid, 0) || 0;
                            const isEnrPaidInFull = enrPaid >= enr.totalFee;
                            
                            return (
                                <motion.div
                                    key={enr.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    animate={{ 
                                        opacity: 1, 
                                        scale: 1, 
                                        y: 0,
                                        filter: isEnrPaidInFull ? 'grayscale(0.6)' : 'grayscale(0)'
                                    }}
                                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className={cn(
                                        "group relative bg-white/40 backdrop-blur-xl border border-white/40 rounded-[2.5rem] p-8 shadow-xl hover:shadow-2xl transition-all overflow-hidden",
                                        isEnrPaidInFull && "bg-slate-50/50 border-slate-200"
                                    )}
                                >
                                    {isEnrPaidInFull && (
                                        <div className="absolute top-4 right-4 z-20">
                                            <div className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-1">
                                                <CheckCircle size={10} /> Paid in Full
                                            </div>
                                        </div>
                                    )}

                                    {/* Glassmorphism background effect */}
                                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all" />
                                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-secondary/5 rounded-full blur-3xl group-hover:bg-secondary/10 transition-all" />

                                    <div className="relative space-y-6">
                                        <div className="flex justify-between items-start">
                                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-50 border-white group-hover:scale-110 transition-all duration-500">
                                                <BookOpen className="text-secondary" size={20} />
                                            </div>
                                            <span className={cn(
                                                "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm",
                                                enr.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                enr.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                enr.status === 'Completed' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                'bg-rose-50 text-rose-600 border-rose-100'
                                            )}>
                                                {enr.status}
                                            </span>
                                        </div>

                                        <div>
                                            <h4 className="font-black text-slate-800 text-lg tracking-tight leading-tight group-hover:text-secondary transition-colors uppercase">
                                                {enr.Course?.name || 'Unknown Course'}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Layers size={12} className="text-slate-400" />
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    {enr.Batch?.name || 'No Batch Assigned'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex justify-between items-end">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Growth Progress</span>
                                                <span className="text-sm font-black text-slate-800">{enr.completionPercentage}%</span>
                                            </div>
                                            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-50 p-0.5">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${enr.completionPercentage}%` }}
                                                    className="h-full bg-gradient-to-r from-secondary to-primary rounded-full relative"
                                                >
                                                    <div className="absolute top-0 right-0 bottom-0 w-2 bg-white/20 animate-pulse" />
                                                </motion.div>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                    Fee Balance
                                                </span>
                                                <span className={cn("text-sm font-black", isEnrPaidInFull ? "text-emerald-600" : "text-slate-800")}>
                                                    Rs. {Math.max(0, enr.totalFee - enrPaid).toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {enr.status === 'Pending' ? (
                                                    <button 
                                                        onClick={() => {
                                                            setSelectedCourseObj(enr.Course);
                                                            setEnrollCourseId(enr.Course?.id || enr.Course?._id);
                                                            setEnrollDiscount(enr.discount || 0);
                                                            setEnrollDownPayment(enr.downPayment || 0);
                                                            setEnrollInstallments(enr.installmentsAllowed || false);
                                                            setEnrollMonths(enr.installmentMonths || 3);
                                                            setPendingEnrollmentToApprove(enr);
                                                            setShowEnrollModal(true);
                                                        }}
                                                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 transition-all active:scale-95 z-50"
                                                    >
                                                        Review & Approve
                                                    </button>
                                                ) : (
                                                    <>
                                                        {enr.InstallmentSchedules?.length > 0 && (
                                                            <div className="flex -space-x-1">
                                                                {enr.InstallmentSchedules.slice(0, 3).map((s, i) => (
                                                                    <div key={s.id} className={cn("w-5 h-5 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-100 flex items-center justify-center text-[7px] font-black text-white", s.status === 'Paid' ? 'bg-emerald-500' : 'bg-slate-200')}>
                                                                        {s.status === 'Paid' ? <Check size={8} /> : i + 1}
                                                                    </div>
                                                                ))}
                                                                {enr.InstallmentSchedules.length > 3 && (
                                                                    <div className="w-5 h-5 rounded-full border-2 border-white bg-slate-800 text-[6px] font-black text-white flex items-center justify-center shadow-sm">
                                                                        +{enr.InstallmentSchedules.length - 3}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                        <motion.div 
                                                            whileHover={{ x: 5 }}
                                                            className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-secondary group-hover:text-white transition-all cursor-pointer shadow-sm"
                                                        >
                                                            <ArrowRight size={18} />
                                                        </motion.div>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* 🔥 NEW: Automated Installment Schedule Timeline */}
                                        {enr.InstallmentSchedules?.length > 0 && (
                                            <div className="pt-8 space-y-4 border-t border-slate-50 relative">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                        <Clock size={12} className="text-secondary" />
                                                        Payment Pipeline
                                                    </h5>
                                                    <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 uppercase tracking-widest">
                                                        {enr.InstallmentSchedules.filter(s => s.status === 'Paid').length} / {enr.InstallmentSchedules.length}
                                                    </span>
                                                </div>
                                                
                                                <div className="relative space-y-4 pl-6">
                                                    {/* The animated vertical pipeline */}
                                                    <div className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <motion.div 
                                                            initial={{ height: 0 }}
                                                            animate={{ height: `${(enr.InstallmentSchedules.filter(s => s.status === 'Paid').length / enr.InstallmentSchedules.length) * 100}%` }}
                                                            className="w-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                                        />
                                                    </div>
                                                    
                                                    {enr.InstallmentSchedules.map((sch, sidx) => (
                                                        <motion.div 
                                                            key={sch.id}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: 0.2 + sidx * 0.05 }}
                                                            className="relative flex items-center justify-between group/sch cursor-default"
                                                        >
                                                            {/* Pipeline Status Node */}
                                                            <div className={cn(
                                                                "absolute -left-[1.375rem] w-3 h-3 rounded-full border-2 border-white shadow-sm z-10 transition-all duration-500",
                                                                sch.status === 'Paid' 
                                                                    ? "bg-emerald-500 ring-4 ring-emerald-500/10 scale-125" 
                                                                    : "bg-white border-slate-200 group-hover/sch:border-secondary"
                                                            )} />
                                                            
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex flex-col">
                                                                        <span className={cn(
                                                                            "text-[10px] font-black uppercase tracking-tight",
                                                                            sch.status === 'Paid' ? "text-emerald-600" : "text-slate-600 group-hover/sch:text-slate-900"
                                                                        )}>
                                                                            {new Date(sch.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                        </span>
                                                                        {new Date(sch.dueDate) < new Date() && sch.status === 'Pending' && (
                                                                            <span className="text-[7px] font-black text-rose-500 uppercase tracking-widest animate-pulse mt-0.5">
                                                                                ⚠️ OVERDUE
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <span className={cn(
                                                                            "text-xs font-black",
                                                                            sch.status === 'Paid' ? "text-emerald-500/40 line-through" : "text-slate-800"
                                                                        )}>
                                                                            Rs. {sch.amount?.toLocaleString()}
                                                                        </span>
                                                                        <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                                            {sch.status === 'Paid' ? 'Reconciled' : 'Installment'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>

            {/* Quick Enroll Modal */}
            <Modal
                isOpen={showEnrollModal}
                onClose={() => {
                    if (!enrolling) {
                        setShowEnrollModal(false);
                        setPendingEnrollmentToApprove(null);
                    }
                }}
                title={pendingEnrollmentToApprove ? 'Approve Course' : 'Quick Enrollment'}
                maxWidth="max-w-lg"
            >
                {/* Success Animation Overlay */}
                <AnimatePresence>
                    {showSuccessAnim && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-50 bg-emerald-500/95 flex flex-col items-center justify-center space-y-6"
                        >
                            <motion.div
                                initial={{ scale: 0, rotate: -45 }}
                                animate={{ scale: 1, rotate: 0 }}
                                className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl"
                            >
                                <Check size={48} className="text-emerald-500" />
                            </motion.div>
                            <div className="text-center">
                                <h3 className="text-3xl font-black text-white tracking-tight uppercase">Successfully Enrolled!</h3>
                                <p className="text-emerald-100 font-bold uppercase tracking-widest mt-2">{student.name} is now a scholar of this course</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="space-y-6">
                    {/* Course Selection */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <BookOpen size={12} className="text-secondary" />
                            Select Academic Course
                        </label>
                        <div className="relative group">
                            <select 
                                value={enrollCourseId}
                                onChange={(e) => {
                                    const cid = e.target.value;
                                    setEnrollCourseId(cid);
                                    setEnrollBatchId(''); // Reset batch on course change
                                    
                                    // Find selected course to get its fee
                                    const c = courses.find(item => (item.id || item._id) == cid);
                                    setSelectedCourseObj(c);
                                    setEnrollDiscount(0); // Reset discount
                                }}
                                disabled={pendingEnrollmentToApprove !== null} // Lock the course dropdown if approving an existing one
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-700 outline-none focus:border-secondary transition-all appearance-none cursor-pointer disabled:opacity-50"
                            >
                                <option value="">Choose Course...</option>
                                {courses?.map(course => (
                                    <option key={course.id || course._id} value={course.id || course._id}>
                                        {course.name} ({course.code}) — Rs. {course.fee?.toLocaleString()}
                                    </option>
                                ))}
                            </select>
                            <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-hover:translate-x-1 transition-all" size={20} />
                        </div>
                    </div>

                    {/* Batch Selection */}
                    <div className={cn("space-y-3 transition-all duration-500", !enrollCourseId ? 'opacity-30 pointer-events-none' : 'opacity-100')}>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Layers size={12} className="text-secondary" />
                            Assign Batch Schedule
                        </label>
                        <div className="relative group">
                            <select 
                                value={enrollBatchId}
                                onChange={(e) => setEnrollBatchId(e.target.value)}
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-700 outline-none focus:border-secondary transition-all appearance-none cursor-pointer"
                            >
                                <option value="">Choose Batch...</option>
                                {batches?.filter(b => (b.courseId?._id || b.courseId) == enrollCourseId).map(batch => (
                                    <option key={batch.id || batch._id} value={batch.id || batch._id}>
                                        {batch.name} — {batch.time}
                                    </option>
                                ))}
                            </select>
                            <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-hover:translate-x-1 transition-all" size={20} />
                        </div>
                        {!enrollBatchId && enrollCourseId && (
                            <p className="text-[9px] font-bold text-amber-500 uppercase tracking-widest text-center px-4">
                                Please select a batch to ensure the student is added to the schedule
                            </p>
                        )}
                    </div>

                    {/* Financial Section */}
                    {selectedCourseObj && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="pt-6 border-t border-slate-100 space-y-6"
                        >
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Original Fee</label>
                                    <div className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-5 py-3 font-bold text-slate-400 italic">
                                        Rs. {selectedCourseObj.fee?.toLocaleString()}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Discount (Rs)</label>
                                    <input 
                                        type="number"
                                        value={enrollDiscount}
                                        onChange={(e) => setEnrollDiscount(Number(e.target.value))}
                                        className="w-full bg-white border-2 border-secondary/20 rounded-xl px-5 py-3 font-black text-secondary outline-none focus:border-secondary transition-all"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            {selectedCourseObj.offerInstallments && (
                                <div className="bg-secondary/5 rounded-2xl p-6 border border-secondary/10 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1">Net Payable Amount</p>
                                        <h4 className="text-2xl font-black text-slate-800 tracking-tight">
                                            Rs. {(selectedCourseObj.fee - enrollDiscount).toLocaleString()}
                                        </h4>
                                    </div>
                                    <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl border border-secondary/10 shadow-sm">
                                        <input 
                                            type="checkbox"
                                            id="installmentToggle"
                                            checked={enrollInstallments}
                                            onChange={(e) => setEnrollInstallments(e.target.checked)}
                                            className="w-5 h-5 accent-secondary cursor-pointer"
                                        />
                                        <label htmlFor="installmentToggle" className="text-[9px] font-black text-slate-600 uppercase tracking-widest cursor-pointer select-none">
                                            Allow Installments
                                        </label>
                                    </div>
                                </div>
                            )}

                            {enrollInstallments && selectedCourseObj.offerInstallments && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="space-y-4"
                                >
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Installment Plan</label>
                                            <select 
                                                value={enrollMonths}
                                                onChange={(e) => setEnrollMonths(Number(e.target.value))}
                                                className="w-full bg-white border-2 border-secondary/20 rounded-xl px-5 py-3 font-black text-secondary outline-none focus:border-secondary transition-all"
                                            >
                                                {(selectedCourseObj.allowed_installments && selectedCourseObj.allowed_installments >= 2
                                                    ? Array.from({ length: selectedCourseObj.allowed_installments - 1 }, (_, i) => i + 2)
                                                    : [2, 3, 4]
                                                ).map(m => {
                                                    const amount = Math.round((selectedCourseObj.fee - enrollDiscount) / m);
                                                    const periodLabel = selectedCourseObj.durationUnit === 'Weeks' ? 'Each Week' : 'Each Month';
                                                    return (
                                                        <option key={m} value={m}>
                                                            {m} Installments ({periodLabel} - Rs. {amount.toLocaleString()})
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">
                                                {selectedCourseObj.durationUnit === 'Weeks' ? 'Weekly Installment' : 'Monthly Installment'}
                                            </label>
                                            <div className="w-full bg-emerald-50 border-2 border-emerald-100 rounded-xl px-5 py-3 font-black text-emerald-600 flex items-center justify-between">
                                                <span className="text-[10px]">{selectedCourseObj.durationUnit === 'Weeks' ? 'Per Week' : 'Per Month'}</span>
                                                <span>Rs. {Math.round((selectedCourseObj.fee - enrollDiscount) / enrollMonths).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Wallet size={12} className="text-secondary" />
                                            Collected Down Payment (Rs)
                                        </label>
                                        <input 
                                            type="number"
                                            value={enrollDownPayment}
                                            onChange={(e) => setEnrollDownPayment(Number(e.target.value))}
                                            className="w-full bg-slate-50 border-2 border-emerald-100 rounded-xl px-5 py-3 font-black text-emerald-600 outline-none focus:border-emerald-500 transition-all"
                                            placeholder="Enter amount paid today..."
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </div>

                <div className="flex gap-4 pt-8">
                    <button
                        onClick={() => {
                            setShowEnrollModal(false);
                            setPendingEnrollmentToApprove(null);
                        }}
                        disabled={enrolling}
                        className="flex-1 py-4 px-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-all active:scale-95 disabled:opacity-50"
                    >
                        Dismiss
                    </button>
                    <button
                        onClick={async () => {
                            if (!enrollCourseId || !enrollBatchId) {
                                toast.error('Select both Course and Batch');
                                return;
                            }
                            setEnrolling(true);
                            try {
                                if (pendingEnrollmentToApprove) {
                                    await apiClient.updateEnrollment(pendingEnrollmentToApprove.id, {
                                        status: 'Active',
                                        batchId: enrollBatchId,
                                        totalFee: selectedCourseObj.fee - enrollDiscount,
                                        discount: enrollDiscount,
                                        installmentsAllowed: enrollInstallments,
                                        downPayment: enrollDownPayment,
                                        installmentMonths: enrollInstallments ? enrollMonths : 1,
                                        monthlyAmount: enrollInstallments ? Math.round((selectedCourseObj.fee - enrollDiscount) / enrollMonths) : 0,
                                        generateInstallments: true
                                    });
                                } else {
                                    await apiClient.createEnrollment({
                                        studentId: student.id,
                                        courseId: enrollCourseId,
                                        batchId: enrollBatchId,
                                        totalFee: selectedCourseObj.fee - enrollDiscount,
                                        discount: enrollDiscount,
                                        installmentsAllowed: enrollInstallments,
                                        downPayment: enrollDownPayment,
                                        installmentMonths: enrollInstallments ? enrollMonths : 1,
                                        monthlyAmount: enrollInstallments ? Math.round((selectedCourseObj.fee - enrollDiscount) / enrollMonths) : 0
                                    });
                                }
                                
                                setShowSuccessAnim(true);
                                setTimeout(async () => {
                                    setShowSuccessAnim(false);
                                    setShowEnrollModal(false);
                                    setPendingEnrollmentToApprove(null);
                                    setEnrollCourseId('');
                                    setEnrollBatchId('');
                                    setEnrollDiscount(0);
                                    setEnrollInstallments(false);
                                    setEnrollMonths(3);
                                    setEnrollDownPayment(0);
                                    setSelectedCourseObj(null);
                                    await fetchStudentDetails();
                                    onUpdate?.();
                                }, 2500);
                                
                            } catch (error) {
                                toast.error(error.response?.data?.error || 'Enrollment failed');
                            } finally {
                                setEnrolling(false);
                            }
                        }}
                        disabled={enrolling || !enrollCourseId || !enrollBatchId}
                        className="flex-[2] py-4 px-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] text-white bg-slate-900 shadow-xl shadow-slate-200 hover:shadow-2xl hover:shadow-slate-300 hover:bg-black transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                        {enrolling ? (
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                        ) : (
                            <Activity size={16} className="text-primary" />
                        )}
                        {enrolling ? 'Processing...' : (pendingEnrollmentToApprove ? 'Approve Admission' : 'Confirm Admission')}
                    </button>
                </div>
            </Modal>

            {/* Quick Stats & Core Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-[2rem] border border-slate-100 shadow-lg">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Course</p>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-secondary/10 text-secondary rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0"><Briefcase size={16} /></div>
                        <p className="font-black text-slate-800 text-xs sm:text-sm">{student?.Course?.name || student?.courseId?.name || 'N/A'}</p>
                    </div>
                </div>
                <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-[2rem] border border-slate-100 shadow-lg">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Batch</p>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 text-primary rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0"><Layers size={16} /></div>
                        <p className="font-black text-slate-800 text-xs sm:text-sm tracking-tight">{student?.Batch?.name || student?.batchId?.name || 'N/A'}</p>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 sm:p-6 rounded-xl sm:rounded-[2rem] border border-blue-200 shadow-lg">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Original Fee</p>
                    <p className="font-black text-slate-800 text-sm sm:text-lg">Rs. {originalFee?.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4 sm:p-6 rounded-xl sm:rounded-[2rem] border border-emerald-200 shadow-lg">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Discount</p>
                    <p className="font-black text-slate-800 text-sm sm:text-lg">Rs. {discount?.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 p-4 sm:p-6 rounded-xl sm:rounded-[2rem] border border-orange-200 shadow-lg">
                    <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-2">Net Payable</p>
                    <p className="font-black text-slate-800 text-sm sm:text-lg">Rs. {netPayable?.toLocaleString()}</p>
                </div>
            </div>

            <Modal
                isOpen={showPaymentModal}
                onClose={() => {
                    setShowPaymentModal(false);
                    setPaymentAmount('');
                    setPaymentDiscount('');
                    setTransactionId('');
                    setPaymentMethod('Cash');
                    setSelectedEnrollmentForPayment(null);
                    setSlipFile(null);
                }}
                title="Fee Payment"
                maxWidth="max-w-lg"
            >
                <div className="space-y-6">
                    {/* Enrollment Selection for Payment */}
                    {(enrollments?.length > 0) && (
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Apply To Course</label>
                            <div className="relative group">
                                <select 
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-black text-slate-700 outline-none focus:border-emerald-500 transition-all cursor-pointer appearance-none"
                                    value={selectedEnrollmentForPayment?.id || ''}
                                    onChange={(e) => {
                                        const enr = enrollments.find(x => x.id == e.target.value);
                                        setSelectedEnrollmentForPayment(enr);
                                        setPaymentAmount('');
                                        setIsFullPay(false);
                                    }}
                                >
                                    <option value="">-- Choose Course --</option>
                                    {enrollments.map(enr => {
                                        const enrPaid = enr.Payments?.reduce((sum, p) => sum + parseFloat(p.amountPaid || 0), 0) || 0;
                                        const remaining = Math.max(0, parseFloat(enr.totalFee || 0) - parseFloat(enr.discount || 0) - enrPaid);
                                        return (
                                            <option key={enr.id} value={enr.id}>
                                                {enr.Course?.name} (Remaining: Rs. {remaining.toLocaleString()})
                                            </option>
                                        );
                                    })}
                                </select>
                                <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-all" size={20} />
                            </div>
                        </div>
                    )}

                    {/* Current Balance Display */}
                    {selectedEnrollmentForPayment && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-emerald-50/50 p-6 rounded-[2rem] border border-emerald-100"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.1em]">Remaining Balance</p>
                                {selectedEnrollmentForPayment.installmentsAllowed && (
                                    <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em]">
                                        {selectedEnrollmentForPayment.installmentMonths}{selectedEnrollmentForPayment.Course?.durationUnit === 'Weeks' ? 'W' : 'M'} Plan
                                    </span>
                                )}
                            </div>
                            <p className="text-4xl font-black text-emerald-600 tracking-tight">
                                Rs. {(selectedEnrollmentForPayment.totalFee - (selectedEnrollmentForPayment.Payments?.reduce((sum, p) => sum + (p.amountPaid || 0), 0) || 0) - (selectedEnrollmentForPayment.discount || 0)).toLocaleString()}
                            </p>
                            {selectedEnrollmentForPayment.installmentsAllowed && (
                                <div className="mt-4 pt-4 border-t border-emerald-100 flex items-center justify-between">
                                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">
                                        Next Installment: Rs. {selectedEnrollmentForPayment.monthlyAmount?.toLocaleString()}
                                    </p>
                                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">
                                        {(selectedEnrollmentForPayment.Payments?.length || 0) + 1} of {selectedEnrollmentForPayment.installmentMonths} ({selectedEnrollmentForPayment.Course?.durationUnit === 'Weeks' ? 'Weeks' : 'Months'})
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Live Reconciliation Calculation */}
                    {selectedEnrollmentForPayment && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-2 text-xs"
                        >
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Live Reconciliation</p>
                            <div className="flex justify-between text-slate-500">
                                <span className="font-bold">Course Fee:</span>
                                <span className="font-black text-slate-700">Rs. {parseFloat(selectedEnrollmentForPayment.totalFee || 0).toLocaleString()}</span>
                            </div>
                            {parseFloat(selectedEnrollmentForPayment.discount || 0) > 0 && (
                                <div className="flex justify-between text-rose-500">
                                    <span className="font-bold">Course Discount:</span>
                                    <span className="font-black">- Rs. {parseFloat(selectedEnrollmentForPayment.discount || 0).toLocaleString()}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-slate-500">
                                <span className="font-bold">Total Paid Invoices:</span>
                                <span className="font-black text-slate-700">Rs. {(selectedEnrollmentForPayment.Payments?.reduce((sum, p) => sum + parseFloat(p.amountPaid || 0), 0) || 0).toLocaleString()}</span>
                            </div>
                            {parseFloat(paymentDiscount || 0) > 0 && (
                                <div className="flex justify-between text-emerald-600 font-bold">
                                    <span>Entered Live Discount:</span>
                                    <span className="font-black">- Rs. {parseFloat(paymentDiscount || 0).toLocaleString()}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-slate-500">
                                <span className="font-bold">This Payment Amount:</span>
                                <span className="font-black text-slate-700">Rs. {parseFloat(paymentAmount || 0).toLocaleString()}</span>
                            </div>
                            <div className="h-px bg-slate-200 my-2" />
                            <div className="flex justify-between text-slate-800 font-black text-sm">
                                <span>Future Remaining:</span>
                                <span>Rs. {Math.max(0, calculateRemainingBalance() - parseFloat(paymentAmount || 0)).toLocaleString()}</span>
                            </div>
                        </motion.div>
                    )}

                    {/* Manual Amount Input */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Payment Amount</label>
                            <button 
                                onClick={handlePayFull}
                                className="text-[9px] font-black text-emerald-600 uppercase tracking-widest hover:underline"
                            >
                                Pay Max
                            </button>
                        </div>
                        <div className="relative group">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-200 group-focus-within:text-emerald-500 transition-colors">Rs</div>
                            <input 
                                type="number" 
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                placeholder="0"
                                className="w-full pl-20 pr-6 py-5 rounded-2xl bg-white border-2 border-slate-100 text-2xl font-black text-slate-800 outline-none focus:border-emerald-500 transition-all placeholder:text-slate-100"
                            />
                        </div>
                        
                        {/* Smart Fee Suggestion Buttons */}
                        <div className="grid grid-cols-3 gap-3 pt-2">
                            <motion.button
                                whileHover={{ scale: 1.02, y: -1 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handlePayFull}
                                className="flex flex-col items-center justify-center p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200 rounded-xl hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-200/50 transition-all group"
                            >
                                <CheckCircle size={20} className="text-emerald-600 mb-1 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">Pay Full</span>
                                <span className="text-[8px] font-bold text-emerald-500 mt-0.5">
                                    Rs. {calculateRemainingBalance().toLocaleString()}
                                </span>
                            </motion.button>
                            
                            <motion.button
                                whileHover={{ scale: 1.02, y: -1 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handlePayHalf}
                                className="flex flex-col items-center justify-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl hover:border-blue-400 hover:shadow-lg hover:shadow-blue-200/50 transition-all group"
                            >
                                <Percent size={20} className="text-blue-600 mb-1 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-black text-blue-700 uppercase tracking-wider">Pay Half</span>
                                <span className="text-[8px] font-bold text-blue-500 mt-0.5">
                                    Rs. {Math.floor(calculateRemainingBalance() / 2).toLocaleString()}
                                </span>
                            </motion.button>
                            
                            <motion.button
                                whileHover={{ scale: 1.02, y: -1 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleCustomAmount}
                                className="flex flex-col items-center justify-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl hover:border-purple-400 hover:shadow-lg hover:shadow-purple-200/50 transition-all group"
                            >
                                <Calculator size={20} className="text-purple-600 mb-1 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-black text-purple-700 uppercase tracking-wider">Custom</span>
                                <span className="text-[8px] font-bold text-purple-500 mt-0.5">Manual</span>
                            </motion.button>
                        </div>
                    </div>

                    {/* Numeric Flat Discount Input */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Apply Flat Discount (Optional)</label>
                        <div className="relative group">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-200 group-focus-within:text-emerald-500 transition-colors">Rs</div>
                            <input 
                                type="number" 
                                value={paymentDiscount}
                                onChange={(e) => setPaymentDiscount(e.target.value)}
                                placeholder="0"
                                className="w-full pl-20 pr-6 py-5 rounded-2xl bg-white border-2 border-slate-100 text-2xl font-black text-slate-800 outline-none focus:border-emerald-500 transition-all placeholder:text-slate-100"
                            />
                        </div>
                    </div>

                    {/* Payment Method Selection */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Select Method</label>
                        <div className="grid grid-cols-3 gap-3">
                            {['Cash', 'Online', 'Bank'].map(method => (
                                <button
                                    key={method}
                                    onClick={() => setPaymentMethod(method)}
                                    className={cn(
                                        'p-4 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all',
                                        paymentMethod === method
                                            ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                                            : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-100 hover:bg-white hover:text-slate-600'
                                    )}
                                >
                                    {method}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Transaction ID for Online/Bank */}
                    {paymentMethod !== 'Cash' && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="space-y-2"
                        >
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Reference # / Trans ID</label>
                            <input
                                type="text"
                                value={transactionId}
                                onChange={(e) => setTransactionId(e.target.value)}
                                placeholder="Enter ID..."
                                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 font-bold text-slate-700 outline-none focus:border-emerald-500 transition-all"
                            />
                        </motion.div>
                    )}

                    {/* Upload Payment Slip */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Upload Payment Slip (Optional)</label>
                        <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={(e) => setSlipFile(e.target.files[0])}
                            className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 font-bold text-slate-700 outline-none focus:border-emerald-500 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-wider file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                        />
                    </div>
                </div>

                <div className="flex gap-4 pt-8">
                    <button 
                        onClick={() => {
                            setShowPaymentModal(false);
                            setPaymentAmount('');
                            setPaymentDiscount('');
                            setTransactionId('');
                            setPaymentMethod('Cash');
                            setSelectedEnrollmentForPayment(null);
                        }}
                        disabled={loading}
                        className="px-6 py-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-500 font-black uppercase tracking-widest text-[10px] transition-all disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <motion.button
                        whileHover={{ scale: loading ? 1 : 1.02 }}
                        whileTap={{ scale: loading ? 1 : 0.98 }}
                        onClick={handlePaymentSubmit}
                        disabled={loading || !paymentAmount || (selectedEnrollmentForPayment && enrollments?.length > 0 && !selectedEnrollmentForPayment)}
                        className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-8 py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl shadow-emerald-300/50 transition-all flex items-center justify-center gap-3 text-[10px] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <CheckCircle size={16} className="text-white" />
                                Pay Remaining: Rs. {(parseFloat(paymentAmount || 0) - parseFloat(paymentDiscount || 0)).toLocaleString()}
                            </>
                        )}
                    </motion.button>
                </div>
            </Modal>

            {/* Pay Fee Button */}
            {currentRemainingBalance > 0 && (
                <motion.button
                    onClick={() => setShowPaymentModal(true)}
                    className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white font-black uppercase tracking-widest hover:shadow-lg transition-all"
                >
                    <div className="flex items-center justify-center gap-2">
                        <CreditCard size={20} />
                        Pay Fee - Rs. {currentRemainingBalance?.toLocaleString()}
                    </div>
                </motion.button>
            )}

            {/* Payment History Table */}
            <div className="bg-white rounded-lg sm:rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-100">
                <div className="p-4 sm:p-6 md:p-8 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
                    <div className="flex-1 w-full">
                        <h3 className="font-black text-slate-800 text-base sm:text-lg md:text-xl tracking-tighter uppercase mb-1">Payment History</h3>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{payments?.length} Transaction(s)</div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    {payments && payments.length > 0 ? (
                        <table className="w-full">
                            <thead className="bg-slate-100/50 hidden sm:table-header-group">
                                <tr>
                                    <th className="px-4 sm:px-8 md:px-10 py-4 sm:py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                    <th className="px-4 sm:px-8 md:px-10 py-4 sm:py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Receipt #</th>
                                    <th className="px-4 sm:px-8 md:px-10 py-4 sm:py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Method</th>
                                    <th className="px-4 sm:px-8 md:px-10 py-4 sm:py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                    <th className="px-4 sm:px-8 md:px-10 py-4 sm:py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-4 sm:px-8 md:px-10 py-4 sm:py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 block sm:table-row-group">
                                {payments.map((payment) => (
                                    <tr key={payment._id || payment.id || payment.receiptNo} className="block sm:table-row group hover:bg-slate-50/80 transition-all border-b sm:border-b border-slate-50 mb-4 sm:mb-0 pb-4 sm:pb-0">
                                        <td className="block sm:table-cell px-4 sm:px-8 md:px-10 py-3 sm:py-6 before:content-['Date'] sm:before:content-none before:text-[10px] before:font-black before:text-slate-400 before:uppercase before:tracking-widest before:mr-3 before:inline-block sm:before:hidden">
                                            <div className="flex items-center gap-2">
                                                <CalendarIcon size={14} className="text-slate-400 flex-shrink-0" />
                                                <span className="font-bold text-slate-700 text-sm">{new Date(payment?.paymentDate).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="block sm:table-cell px-4 sm:px-8 md:px-10 py-3 sm:py-6 before:content-['Receipt'] sm:before:content-none before:text-[10px] before:font-black before:text-slate-400 before:uppercase before:tracking-widest before:mr-3 before:inline-block sm:before:hidden">
                                            <span className="font-bold text-slate-700 text-sm">{payment?.receiptNo}</span>
                                        </td>
                                        <td className="block sm:table-cell px-4 sm:px-8 md:px-10 py-3 sm:py-6 before:content-['Method'] sm:before:content-none before:text-[10px] before:font-black before:text-slate-400 before:uppercase before:tracking-widest before:mr-3 before:inline-block sm:before:hidden">
                                            <span className={cn('px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5', getPaymentMethodColor(payment?.paymentMethod))}>
                                                {getPaymentMethodIcon(payment?.paymentMethod)}
                                                {payment?.paymentMethod}
                                            </span>
                                        </td>
                                        <td className="block sm:table-cell px-4 sm:px-8 md:px-10 py-3 sm:py-6 before:content-['Amount'] sm:before:content-none before:text-[10px] before:font-black before:text-slate-400 before:uppercase before:tracking-widest before:mr-3 before:inline-block sm:before:hidden">
                                            <div className="flex flex-col">
                                                <span className="font-black text-slate-800 text-sm sm:text-base">Rs. {payment?.amountPaid?.toLocaleString()}</span>
                                                {payment.Enrollment && (
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                        {payment.Enrollment.Course?.name} 
                                                        {payment.installmentNo && ` • ${payment.Enrollment.Course?.durationUnit === 'Weeks' ? 'Week' : 'Month'} ${payment.installmentNo} of ${payment.Enrollment.installmentMonths}`}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="block sm:table-cell px-4 sm:px-8 md:px-10 py-3 sm:py-6 before:content-['Status'] sm:before:content-none before:text-[10px] before:font-black before:text-slate-400 before:uppercase before:tracking-widest before:mr-3 before:inline-block sm:before:hidden">
                                            <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-600 inline-block">
                                                ✓ Paid
                                            </span>
                                        </td>
                                        <td className="block sm:table-cell px-4 sm:px-8 md:px-10 py-3 sm:py-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                {payment?.slipUrl && (
                                                    <a
                                                        href={payment.slipUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="group relative p-2 sm:p-3 bg-emerald-50 text-emerald-600 rounded-lg sm:rounded-xl hover:bg-emerald-600 hover:text-white transition-all duration-200 hover:shadow-lg active:scale-95 flex items-center justify-center"
                                                        title="View Slip"
                                                    >
                                                        <FileText size={16} />
                                                        <span className="absolute -top-9 right-0 whitespace-nowrap bg-slate-800 text-white text-[10px] font-semibold px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                                                            View Slip
                                                        </span>
                                                    </a>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => handlePrintReceipt(payment)}
                                                    className="group relative p-2 sm:p-3 bg-secondary/10 text-secondary rounded-lg sm:rounded-xl hover:bg-secondary hover:text-white transition-all duration-200 hover:shadow-lg active:scale-95 flex items-center justify-center"
                                                    title="Print 3-Copy Receipt (A4 Landscape)"
                                                >
                                                    <Printer size={16} />
                                                {/* Hover tooltip */}
                                                <span className="absolute -top-9 right-0 whitespace-nowrap bg-slate-800 text-white text-[10px] font-semibold px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                                                    Print 3-Copy Receipt (A4 Landscape)
                                                </span>
                                            </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-8 text-center">
                            <AlertTriangle size={32} className="text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 font-bold text-sm">No payments recorded yet</p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Click 'Pay Fee' to record the first payment</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Payment Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-6">
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-6 rounded-2xl border border-emerald-200 shadow-lg">
                    <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Total Paid</h4>
                    <p className="text-2xl font-black text-emerald-700">Rs. {totalPaid?.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-6 rounded-2xl border border-blue-200 shadow-lg">
                    <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Original Fee</h4>
                    <p className="text-2xl font-black text-blue-700">Rs. {originalFee?.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-6 rounded-2xl border border-amber-200 shadow-lg">
                    <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Discount</h4>
                    <p className="text-2xl font-black text-amber-700">Rs. {discount?.toLocaleString()}</p>
                </div>
                <div className={cn('p-6 rounded-2xl border shadow-lg', currentRemainingBalance <= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-orange-50 border-orange-200')}>
                    <h4 className={cn('text-[10px] font-black uppercase tracking-widest mb-2', currentRemainingBalance <= 0 ? 'text-emerald-600' : 'text-orange-600')}>
                        {currentRemainingBalance <= 0 ? 'PAID IN FULL' : 'Remaining Balance'}
                    </h4>
                    <p className={cn('text-2xl font-black', currentRemainingBalance <= 0 ? 'text-emerald-700' : 'text-orange-700')}>
                        Rs. {Math.max(0, currentRemainingBalance)?.toLocaleString()}
                    </p>
                </div>
            </div>

            {/* Password Reset Modal */}
            <AnimatePresence>
                {showPasswordReset && (
                    <Modal
                        isOpen={showPasswordReset}
                        onClose={() => {
                            setShowPasswordReset(false);
                            setNewPassword('');
                            setShowPassword(false);
                        }}
                        title="Reset Student Password"
                        maxWidth="max-w-md"
                        className="bg-white/90"
                    >
                        <form onSubmit={handleResetPassword} className="space-y-5">
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 block mb-2">New Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className="input-field pr-12 text-slate-800"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Enter new password (min. 6 chars)"
                                        required
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(p => !p)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                        title={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1.5 ml-1">Must be at least 6 characters long.</p>
                            </div>
                            <button 
                                type="submit" 
                                disabled={isResettingPassword}
                                className="btn-secondary w-full py-4 font-black uppercase tracking-wider disabled:opacity-55"
                            >
                                {isResettingPassword ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </form>
                    </Modal>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StudentLedger;
