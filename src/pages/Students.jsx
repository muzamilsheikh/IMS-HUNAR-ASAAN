import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
    Plus,
    Search,
    Grid,
    List as ListIcon,
    Eye,
    CheckCircle2,
    Clock,
    AlertCircle,
    Phone,
    Filter,
    X,
    Trash2,
    AlertTriangle,
    BookOpen
} from 'lucide-react';
import RegistrationForm from '../components/students/RegistrationForm';
import StudentLedger from '../components/students/StudentLedger';
import { Pencil, Printer } from 'lucide-react'; // ✅ Import Edit and Printer icons
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import toast from 'react-hot-toast';
import apiClient from '../utils/api';
import generateReceipt from '../utils/generateReceipt';

const Students = () => {
    const { students, courses, batches, loading, user, settings } = useApp();
    const location = useLocation();
    const [view, setView] = useState('grid');
    const [showRegForm, setShowRegForm] = useState(false);
    const [selectedStudentId, setSelectedStudentId] = useState(null);
    const [editingStudent, setEditingStudent] = useState(null); // ✅ For edit mode
    const [deleteConfirm, setDeleteConfirm] = useState(null); // ✅ For delete confirmation
    const [isDeleting, setIsDeleting] = useState(false); // ✅ Loading state for delete

    // ✅ Handle Edit Student
    const handleEditStudent = (student) => {
      setEditingStudent(student);
      setShowRegForm(true);
    };

    // ✅ Close form and reset editing state
    const handleCloseForm = () => {
      setShowRegForm(false);
      setEditingStudent(null);
    };

    // ✅ Handle Print Challan
    const handlePrintChallan = (student, course) => {
      const studentTotalFee = Number(student.totalFee) || 0;
      const studentDiscount = Number(student.discount) || 0;
      const studentPaidAmount = Number(student.paidAmount) || 0;
      const unpaidBalance = Math.max(0, studentTotalFee - studentDiscount - studentPaidAmount);

      const latestPayment = student.Payments && student.Payments.length > 0
        ? student.Payments[student.Payments.length - 1]
        : null;

      const challanData = {
        studentName: student.name,
        studentId: student.customId || `STU-${student.id || student._id}`,
        course: course?.name || 'Assigned Course',
        amount: unpaidBalance > 0 ? unpaidBalance : studentPaidAmount,
        balance: unpaidBalance,
        method: latestPayment?.method || 'Bank Transfer / Cash',
        date: latestPayment?.date || new Date().toISOString().split('T')[0],
        receiptNo: latestPayment?.id ? `REC-${latestPayment.id}` : `CHL-${student.id || student._id}`
      };

      const challanStatus = unpaidBalance === 0 ? 'PAID' : 'NOT PAID';
      generateReceipt(challanData, challanStatus, settings);
    };

    // ✅ Handle Delete Student with confirmation
    const handleDeleteStudent = async (studentId) => {
      setIsDeleting(true);
      try {
        await apiClient.deleteStudent(studentId);
        toast.success('Student record deleted successfully');
        setDeleteConfirm(null);
        // Refresh the page to update the list
        window.location.reload();
      } catch (error) {
        console.error('Delete error:', error);
        toast.error(error.response?.data?.error || 'Failed to delete student');
      } finally {
        setIsDeleting(false);
      }
    };

    useEffect(() => {
        if (location.state?.batchId) {
            setFilters(prev => ({ ...prev, batch: location.state.batchId }));
        }
    }, [location.state]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setSelectedStudentId(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const [filters, setFilters] = useState({
        search: '',
        course: '',
        batch: '',
        status: ''
    });

    const filteredStudents = students.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(filters.search.toLowerCase()) ||
            s.customId?.toLowerCase().includes(filters.search.toLowerCase()) ||
            s.phone?.includes(filters.search);

        const sCourseId = s.courseId?._id || s.courseId;
        const sBatchId = s.batchId?._id || s.batchId;

        const matchesCourse = filters.course ? sCourseId === filters.course : true;
        const matchesBatch = filters.batch ? sBatchId === filters.batch : true;

        // Filter by status
        let matchesStatus = true;
        if (filters.status) {
            if (filters.status === 'Active') matchesStatus = s.status === 'Active';
            else if (filters.status === 'Settled') matchesStatus = s.status === 'Settled';
            else if (filters.status === 'Dropped') matchesStatus = s.status === 'Dropped';
            else if (filters.status === 'Passout') matchesStatus = s.status === 'Passout';
            else if (filters.status === 'Paid') matchesStatus = !s.Payments?.some(p => p.status === 'Pending');
            else if (filters.status === 'Pending') {
                const hasOverdue = s.Payments?.some(p => p.status === 'Pending' && new Date(p.date) < new Date());
                matchesStatus = s.Payments?.some(p => p.status === 'Pending') && !hasOverdue;
            }
            else if (filters.status === 'Overdue') {
                matchesStatus = s.Payments?.some(p => p.status === 'Pending' && new Date(p.date) < new Date());
            }
        }

        return matchesSearch && matchesCourse && matchesBatch && matchesStatus;
    });

    if (loading && students.length === 0) return <div className="h-[80vh] flex items-center justify-center font-black text-slate-300 animate-pulse uppercase tracking-[0.5em]">Synchronizing Registry...</div>;

    return (
        <div className="space-y-12 animate-in fade-in duration-500 pb-20 pt-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                        <span className="text-[10px] font-black text-secondary uppercase tracking-[0.4em]">Core Registry Database</span>
                    </div>
                    <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-800 tracking-tighter">Student Directory</h2>
                    <p className="text-slate-400 mt-2 font-black uppercase text-[10px] tracking-widest italic opacity-60">Manage profiles, financial ledger and system status.</p>
                </div>
                <button onClick={() => setShowRegForm(true)} className="btn-secondary py-4 sm:py-5 px-6 sm:px-10 flex items-center gap-2 sm:gap-3 shadow-2xl shadow-secondary/40 active:scale-95 transition-all w-full sm:w-auto justify-center">
                    <Plus size={20} sm:size={24} />
                    <span className="font-black tracking-tight text-base sm:text-lg">Launch Admission</span>
                </button>
            </div>

            {/* Filtering System */}
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-2xl space-y-8">
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
                        <input
                            type="text"
                            placeholder="Search by Name, ID or Phone Identifier..."
                            className="w-full pl-16 pr-8 py-5 rounded-[1.5rem] border border-slate-100 bg-slate-50 focus:bg-white focus:ring-8 focus:ring-secondary/5 outline-none transition-all font-bold text-slate-600"
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-[1.5rem] border border-slate-200">
                        <button onClick={() => setView('grid')} className={cn("p-4 rounded-xl transition-all", view === 'grid' ? 'bg-white shadow-xl text-secondary' : 'text-slate-400')}>
                            <Grid size={24} />
                        </button>
                        <button onClick={() => setView('list')} className={cn("p-4 rounded-xl transition-all", view === 'list' ? 'bg-white shadow-xl text-secondary' : 'text-slate-400')}>
                            <ListIcon size={24} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-8 border-t border-slate-50">
                    <select className="input-field py-4 bg-slate-50 border-transparent font-bold text-xs uppercase tracking-widest" value={filters.course} onChange={e => setFilters({ ...filters, course: e.target.value })}>
                        <option value="">All Academic Paths</option>
                        {courses.map(c => <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>)}
                    </select>
                    <select className="input-field py-4 bg-slate-50 border-transparent font-bold text-xs uppercase tracking-widest" value={filters.batch} onChange={e => setFilters({ ...filters, batch: e.target.value })}>
                        <option value="">All Active Batches</option>
                        {batches.map(b => <option key={b._id || b.id} value={b._id || b.id}>{b.name}</option>)}
                    </select>
                    <select className="input-field py-4 bg-slate-50 border-transparent font-bold text-xs uppercase tracking-widest" value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
                        <option value="">Filter by Status</option>
                        <option value="Active">System Active</option>
                        <option value="Settled">Fully Settled</option>
                        <option value="Dropped">Dropped / Dormant</option>
                        <option value="Passout">Passout / Certified</option>
                        <option value="Paid">Fully Paid</option>
                        <option value="Pending">Payment Pending</option>
                        <option value="Overdue">Past Due (Alert)</option>
                    </select>
                    <div className="flex items-center justify-end">
                        <button
                            onClick={() => setFilters({ search: '', course: '', batch: '', status: '' })}
                            className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-600 transition-colors flex items-center gap-2 bg-rose-50 px-6 py-4 rounded-2xl border border-rose-100"
                        >
                            <X size={14} /> Reset Filters
                        </button>
                    </div>
                </div>
            </div>

            {view === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {filteredStudents.map((student) => {
                        const studentCourseId = student.courseId?._id || student.courseId;
                        const course = courses.find(c => (c._id === studentCourseId || c.id === studentCourseId));
                        const studentTotalFee = Number(student.totalFee) || 0;
                        const studentDiscount = Number(student.discount) || 0;
                        const studentPaidAmount = Number(student.paidAmount) || 0;
                        
                        const netPayable = studentTotalFee - studentDiscount;
                        let progress = 0;
                        if (netPayable > 0) {
                            progress = Math.min(100, Math.max(0, (studentPaidAmount / netPayable) * 100));
                        } else if (studentPaidAmount > 0) {
                            progress = 100;
                        }
                        
                        const unpaidBalance = Math.max(0, studentTotalFee - studentDiscount - studentPaidAmount);

                        const today = new Date().toISOString().split('T')[0];
                        const hasOverdue = student.Payments?.some(p => p.status === 'Pending' && p.date < today);
                        const hasPending = student.Payments?.some(p => p.status === 'Pending');

                        return (
                            <motion.div
                                layout
                                key={student._id || student.id}
                                className="glass-card group hover:border-secondary transition-all cursor-pointer bg-white relative p-1 leading-none shadow-xl hover:shadow-2xl"
                                onClick={() => setSelectedStudentId(student._id || student.id)}
                            >
                                <div className="p-10">
                                    <div className="flex justify-between items-start mb-10">
                                        <div className="w-20 h-20 rounded-[2rem] bg-slate-50 text-slate-300 flex items-center justify-center font-black text-4xl border border-slate-100 group-hover:bg-primary group-hover:text-secondary transition-all duration-700 shadow-inner group-hover:rotate-6">
                                            {student.name.charAt(0)}
                                        </div>
                                        <div className="flex flex-col items-end gap-3">
                                            <div className={cn(
                                                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border shadow-sm",
                                                hasOverdue ? 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse' :
                                                    !hasPending ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                        'bg-amber-50 text-amber-600 border-amber-100'
                                            )}>
                                                {hasOverdue ? 'Overdue' : !hasPending ? 'Settled' : 'Cycle Active'}
                                            </div>
                                            <p className="text-[10px] font-black text-slate-300 tracking-[0.4em] italic">{student.customId}</p>
                                        </div>
                                    </div>

                                    <h4 className="text-3xl font-black text-slate-800 tracking-tighter leading-none mb-4 uppercase">{student.name}</h4>
                                    <div className="flex items-center gap-4 text-slate-400 mb-10">
                                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                            <Phone size={12} className="text-secondary" />
                                            <span className="text-[10px] font-black tracking-widest text-slate-600">{student.phone || 'N/A'}</span>
                                        </div>
                                        <span className="text-[10px] font-black text-secondary/60 uppercase tracking-widest italic">{course?.name}</span>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                                            <span>Tuition Clearance</span>
                                            <span className="text-slate-800">{Math.round(progress)}% Verified</span>
                                        </div>
                                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner p-0.5">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progress}%` }}
                                                className={cn("h-full rounded-full transition-all duration-1000", hasOverdue ? 'bg-rose-500' : 'bg-secondary')}
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-12 flex items-center justify-between pt-10 border-t border-slate-50">
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.5em] mb-2 leading-none">Unpaid Balance</p>
                                            <p className="font-black text-slate-800 text-2xl tracking-tighter italic leading-none">Rs. {unpaidBalance.toLocaleString()}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {/* ✅ Edit Button */}
                                            <button
                                                onClick={(e) => {
                                                   e.stopPropagation();
                                                    handleEditStudent(student);
                                                }}
                                                className="w-12 h-12 bg-blue-50 text-blue-500 rounded-[1.2rem] flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all shadow-sm border border-blue-100 hover:shadow-md"
                                                title="Edit Student"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            {/* ✅ Print Challan Button */}
                                            <button
                                                onClick={(e) => {
                                                   e.stopPropagation();
                                                    handlePrintChallan(student, course);
                                                }}
                                                className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-[1.2rem] flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-sm border border-emerald-100 hover:shadow-md"
                                                title="Print Fee Challan"
                                            >
                                                <Printer size={18} />
                                            </button>
                                            {/* ✅ Delete Button */}
                                            {user?.role !== 'accounts_manager' && (
                                                <button
                                                    onClick={(e) => {
                                                       e.stopPropagation();
                                                        setDeleteConfirm(student);
                                                    }}
                                                    className="w-12 h-12 bg-red-50 text-red-500 rounded-[1.2rem] flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100 hover:shadow-md active:scale-95"
                                                    title="Delete Student"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                            {/* View Button */}
                                            <div className="w-14 h-14 bg-slate-50 text-slate-300 rounded-[1.2rem] flex items-center justify-center group-hover:bg-secondary group-hover:text-white transition-all shadow-sm border border-slate-100 group-hover:translate-x-1 group-hover:-translate-y-1">
                                                <Eye size={24} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            ) : (
                /* Data Table Layout */
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                                    <th className="py-4 px-6">Student Name</th>
                                    <th className="py-4 px-6">Contact</th>
                                    <th className="py-4 px-6">Enrollment Status</th>
                                    <th className="py-4 px-6">Fee Status</th>
                                    <th className="py-4 px-6 text-right">Pending Amount (PKR)</th>
                                    <th className="py-4 px-6 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {filteredStudents.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                                            No student records found matching your filters.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStudents.map((student) => {
                                        const studentCourseId = student.courseId?._id || student.courseId;
                                        const course = courses.find(c => (c._id === studentCourseId || c.id === studentCourseId));
                                        const studentTotalFee = Number(student.totalFee) || 0;
                                        const studentDiscount = Number(student.discount) || 0;
                                        const studentPaidAmount = Number(student.paidAmount) || 0;
                                        const unpaidBalance = Math.max(0, studentTotalFee - studentDiscount - studentPaidAmount);

                                        const today = new Date().toISOString().split('T')[0];
                                        const hasOverdue = student.Payments?.some(p => p.status === 'Pending' && p.date < today);
                                        const hasPending = student.Payments?.some(p => p.status === 'Pending');

                                        // Enrollment Status: Enrolled vs Lead / Pending / Passout
                                        const isEnrolled = student.status === 'Active' || student.status === 'Settled' || !student.status;
                                        const enrollmentLabel = student.status ? student.status : (isEnrolled ? 'Enrolled' : 'Lead');

                                        // Fee Status badge
                                        let feeStatusText = 'Paid';
                                        let feeStatusStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                                        if (hasOverdue) {
                                            feeStatusText = 'Overdue';
                                            feeStatusStyle = 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse';
                                        } else if (unpaidBalance > 0 && studentPaidAmount > 0) {
                                            feeStatusText = 'Partial';
                                            feeStatusStyle = 'bg-amber-50 text-amber-700 border-amber-200';
                                        } else if (unpaidBalance > 0 && studentPaidAmount === 0) {
                                            feeStatusText = 'Unpaid';
                                            feeStatusStyle = 'bg-red-50 text-red-700 border-red-200';
                                        }

                                        return (
                                            <tr key={student._id || student.id} className="hover:bg-slate-50/80 transition-colors">
                                                {/* 1. Student Name */}
                                                <td className="py-4 px-6 font-bold text-slate-800">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center font-black text-base border border-secondary/20">
                                                            {student.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="font-extrabold text-slate-800">{student.name}</div>
                                                            <div className="text-xs text-slate-400 font-semibold">{student.customId || 'N/A'} • {course?.name || 'No Course'}</div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* 2. Contact */}
                                                <td className="py-4 px-6 font-medium text-slate-600">
                                                    <div className="flex items-center gap-2">
                                                        <Phone size={14} className="text-secondary" />
                                                        <span>{student.phone || 'N/A'}</span>
                                                    </div>
                                                    {student.email && (
                                                        <div className="text-xs text-slate-400 mt-0.5">{student.email}</div>
                                                    )}
                                                </td>

                                                {/* 3. Enrollment Status */}
                                                <td className="py-4 px-6">
                                                    <span className={cn(
                                                        "px-3 py-1 rounded-lg text-xs font-extrabold uppercase border inline-block",
                                                        student.status === 'Active' || student.status === 'Settled'
                                                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                            : student.status === 'Dropped'
                                                            ? 'bg-slate-100 text-slate-600 border-slate-200'
                                                            : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                                    )}>
                                                        {enrollmentLabel}
                                                    </span>
                                                </td>

                                                {/* 4. Fee Status */}
                                                <td className="py-4 px-6">
                                                    <span className={cn("px-3 py-1 rounded-lg text-xs font-extrabold uppercase border inline-block", feeStatusStyle)}>
                                                        {feeStatusText}
                                                    </span>
                                                </td>

                                                {/* 5. Pending Amount (PKR) */}
                                                <td className="py-4 px-6 text-right font-extrabold text-slate-800">
                                                    Rs. {unpaidBalance.toLocaleString()}
                                                </td>

                                                {/* 6. Actions (Edit / View / Print Challan) */}
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handleEditStudent(student)}
                                                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all border border-blue-100"
                                                            title="Edit Student"
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => setSelectedStudentId(student._id || student.id)}
                                                            className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-secondary hover:text-white transition-all border border-slate-200"
                                                            title="View Student Details"
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handlePrintChallan(student, course)}
                                                            className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100"
                                                            title="Print Challan"
                                                        >
                                                            <Printer size={16} />
                                                        </button>
                                                        {user?.role !== 'accounts_manager' && (
                                                            <button
                                                                onClick={() => setDeleteConfirm(student)}
                                                                className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all border border-red-100"
                                                                title="Delete Student"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <AnimatePresence>
                {showRegForm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-2xl flex items-center justify-center p-4 overflow-y-auto">
                        <div className="min-h-[140vh] py-20 w-full flex items-center justify-center">
                            <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }} className="w-full max-w-5xl relative">
                                <button onClick={handleCloseForm} className="absolute -top-16 right-0 text-white/60 hover:text-white font-black text-[10px] uppercase tracking-[0.4em] flex items-center gap-4 bg-white/5 px-8 py-4 rounded-full border border-white/10 hover:bg-white/10 transition-all shadow-2xl">
                                    Abandom Admission Portal
                                </button>
                                <RegistrationForm editingStudent={editingStudent} onSuccess={() => handleCloseForm()} />
                            </motion.div>
                        </div>
                    </motion.div>
                )}

                {selectedStudentId && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-slate-50/80 backdrop-blur-3xl p-4 md:p-12 overflow-y-auto flex justify-center">
                        <div className="h-fit w-full max-w-6xl relative py-12">
                            <motion.div initial={{ scale: 0.95, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 50 }} className="w-full relative">
                                <button onClick={() => setSelectedStudentId(null)} className="absolute -top-16 right-0 text-slate-400 hover:text-rose-500 font-black text-[10px] uppercase tracking-[0.4em] flex items-center gap-4 bg-white px-8 py-4 rounded-full border border-slate-100 hover:border-rose-100 transition-all shadow-2xl">
                                    Exit Scholar Ledger
                                </button>
                                <StudentLedger studentId={selectedStudentId} onUpdate={() => { }} />
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteConfirm && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => !isDeleting && setDeleteConfirm(null)}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }} 
                            animate={{ scale: 1, y: 0 }} 
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden"
                        >
                            {/* Header */}
                            <div className="bg-gradient-to-r from-red-50 to-rose-50 border-b border-red-100 px-8 py-8">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                                        <AlertTriangle size={20} className="text-red-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-800 tracking-tight">Delete Student Record?</h3>
                                        <p className="text-sm text-slate-500 mt-1">This action cannot be undone</p>
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="px-8 py-8 space-y-6">
                                <div className="bg-red-50 border border-red-100 rounded-xl p-6">
                                    <p className="text-sm font-semibold text-slate-700 mb-3">This will permanently delete:</p>
                                    <ul className="space-y-2 text-sm text-slate-600">
                                        <li className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                            Student Record: <span className="font-bold text-slate-800">{deleteConfirm.name}</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                            User Account: <span className="font-mono text-xs bg-white px-2 py-1 rounded border border-slate-200">{deleteConfirm.email}</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                            All Payment Records: <span className="font-bold text-slate-800">{deleteConfirm.Payments?.length || 0} records</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                                    <p className="text-xs text-amber-700 font-semibold">
                                        ⚠️ Archival Tip: Consider marking the student as "Dropped" instead of deletion to preserve financial history.
                                    </p>
                                </div>

                                <p className="text-sm text-slate-600">Are you absolutely sure you want to delete this student and all associated records?</p>
                            </div>

                            {/* Actions */}
                            <div className="bg-slate-50 border-t border-slate-100 px-8 py-6 flex gap-4">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    disabled={isDeleting}
                                    className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDeleteStudent(deleteConfirm.id || deleteConfirm._id)}
                                    disabled={isDeleting}
                                    className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isDeleting ? (
                                        <>
                                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 size={16} />
                                            Delete Permanently
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Students;
