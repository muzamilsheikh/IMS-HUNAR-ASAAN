import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Bookmark, Clock, User, ArrowRight, Play, BookOpen, Video, CreditCard, Receipt, MapPin, Phone, Mail, CheckCircle, PlusCircle, Calendar, MessageSquare, Download, Printer } from 'lucide-react';
import { cn } from '../utils/cn';
import toast from 'react-hot-toast';
import Modal from '../components/layout/Modal';
import generateReceipt from '../utils/generateReceipt';

const StudentDashboard = () => {
    const { user, api, settings } = useApp();
    const [studentData, setStudentData] = useState(null);
    const [enrollments, setEnrollments] = useState([]);
    const [liveClass, setLiveClass] = useState(null);
    const [availableCourses, setAvailableCourses] = useState([]);
    const [payments, setPayments] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Main navigation tabs
    const [mainTab, setMainTab] = useState('learning'); // 'learning', 'financials', 'catalog'
    const [activeFilter, setActiveFilter] = useState('All courses');
    const [enrolling, setEnrolling] = useState(false);

    // Dynamic ledger states
    const [ledgerTab, setLedgerTab] = useState('all'); // 'all', 'paid', 'due'

    // Class schedules date filter
    const [scheduleDateFilter, setScheduleDateFilter] = useState('');

    // Modal state for course details
    const [selectedCourseForModal, setSelectedCourseForModal] = useState(null);
    const [questionText, setQuestionText] = useState('');
    const [sendingQuestion, setSendingQuestion] = useState(false);

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                if (user?.email) {
                    setLoading(true);
                    
                    // Fetch Courses
                    api.getCourses().then(res => {
                        if (Array.isArray(res)) {
                            setAvailableCourses(res);
                        } else if (res.courses) {
                            setAvailableCourses(res.courses);
                        }
                    }).catch(e => console.error(e));

                    const allStudents = await api.getStudents();
                    const student = allStudents.find(s => s?.email?.toLowerCase() === user?.email?.toLowerCase());
                    
                    if (student) {
                        const sid = student.id || student._id;
                        const details = await api.getStudentById(sid);
                        setStudentData(details.student);
                        setEnrollments(details.enrollments || []);
                        
                        // Fetch Payments
                        try {
                            const paymentsRes = await api.getPaymentsByStudent(sid);
                            if (paymentsRes.success || paymentsRes.payments) {
                                setPayments(paymentsRes.payments || paymentsRes);
                            }
                        } catch (e) { console.error('Error fetching payments', e); }

                        // Fetch Schedules from batches/schedule
                        try {
                            const batchIds = (details.enrollments || []).map(e => e.batchId).filter(Boolean);
                            const activeBatchId = batchIds[0] || details.student?.batchId;
                            
                            const schedsRes = await api.get('/batches/schedule', {
                                params: activeBatchId ? { batchId: activeBatchId } : {}
                            });
                            
                            if (schedsRes?.success && schedsRes?.schedules) {
                                const studentSchedules = schedsRes.schedules.filter(s => batchIds.includes(s.batchId));
                                setSchedules(studentSchedules);
                            }
                        } catch (e) { console.error('Error fetching schedules', e); }

                        try {
                            const liveSessionResponse = await api.getStudentLiveSession();
                            if (liveSessionResponse.success && liveSessionResponse.liveSession) {
                                setLiveClass(liveSessionResponse.liveSession);
                            }
                        } catch (e) { /* ignore */ }
                    }
                }
            } catch (error) {
                console.error('Error fetching student dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchAllData();
        }
    }, [user, api]);

    const handleEnroll = async (courseId) => {
        if (!studentData) return;
        setEnrolling(true);
        try {
            // Check if already enrolled or requested
            const alreadyEnrolled = enrollments.some(e => e.Course?.id === courseId || e.courseId === courseId);
            if (alreadyEnrolled) {
                toast.error('You are already enrolled or have applied for this course!');
                setEnrolling(false);
                return;
            }

            const courseDetails = availableCourses.find(c => c.id === courseId);
            const res = await api.createEnrollment({
                studentId: studentData.id,
                courseId: courseId,
                status: 'Pending',
                totalFee: courseDetails?.fee || 0,
                enrollmentDate: new Date().toISOString()
            });
            
            toast.success('Successfully applied for the course! Waiting for admin approval.');
            // Refresh enrollments slightly fake update for fast UI
            setEnrollments([...enrollments, { 
                id: `req_${Math.random()}`, 
                isRequest: true,
                Course: courseDetails, 
                category: courseDetails?.name?.toLowerCase().includes('design') ? 'Design' : 'Tech', 
                status: 'Pending',
                totalFee: courseDetails?.fee || 0,
                completionPercentage: 0, 
                totalLessons: 30 
            }]);
            setMainTab('learning');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to enroll. Please contact administration.');
        }
        setEnrolling(false);
    };

    // Smart Class calculator helper
    const calculateClassStats = (enr) => {
        if (!enr) return { totalHeld: 0, remaining: 0 };
        const commencementDate = enr.enrollmentDate || studentData?.commencementDate || new Date().toISOString().split('T')[0];
        const startDate = new Date(commencementDate);
        const today = new Date();
        const frequency = enr.Course?.classesPerWeek || 2;
        const total = enr.Course?.totalClasses || 24;
        
        let totalHeld = 0;
        if (today > startDate) {
            const diffTime = Math.abs(today - startDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const diffWeeks = diffDays / 7;
            totalHeld = Math.min(total, Math.floor(diffWeeks * frequency));
        }
        
        const remaining = Math.max(0, total - totalHeld);
        return { totalHeld, remaining, frequency, total };
    };

    const handleAskQuestion = async () => {
        if (!questionText.trim()) return;
        setSendingQuestion(true);
        try {
            // Target the first instructor Id linked to the course or default to admin
            const instructorId = selectedCourseForModal?.Course?.Instructors?.[0]?.id || 1;
            await api.sendMessage({
                receiverId: instructorId,
                message: `[Question about ${selectedCourseForModal?.Course?.name}] ${questionText.trim()}`,
                messageType: 'text'
            });
            toast.success('Question dispatched successfully directly to the instructor!');
            setQuestionText('');
            setSelectedCourseForModal(null);
        } catch (error) {
            console.error('Error sending question:', error);
            toast.error('Failed to send question. Please try again.');
        } finally {
            setSendingQuestion(false);
        }
    };

    // ── Print Paid Receipt (tri-plicate A4 landscape) ──────────────────────────
    const handleDownloadSlip = (item) => {
        if (!studentData) {
            toast.error('Student data not ready yet. Please try again.');
            return;
        }
        const data = {
            studentName : studentData.name        || '—',
            studentId   : studentData.id          || '—',
            course      : item.Course?.name       || item.courseName || 'N/A',
            amount      : Number(item.amount      || 0),
            balance     : Number(item.balance     ?? item.remainingBalance ?? 0),
            method      : item.method             || item.paymentMethod || 'Cash',
            date        : item.date               || item.paymentDate || new Date().toISOString(),
            receiptNo   : item.receiptNo          || `RCP-${item.id || Date.now()}`,
        };
        generateReceipt(data, 'PAID', settings);
    };

    // ── Print Pending Voucher (tri-plicate A4 landscape) ────────────────────────
    const handleDownloadVoucher = (item) => {
        if (!studentData) {
            toast.error('Student data not ready yet. Please try again.');
            return;
        }
        // For pending installments balance = full amount still outstanding
        const totalPaid = payments
            .filter(p => p.status === 'Paid' || p.amountPaid)
            .reduce((s, p) => s + Number(p.amountPaid || p.amount || 0), 0);
        const totalFee  = enrollments.reduce((s, e) => s + Number(e.totalFee || 0), 0)
                          || Number(studentData.totalFee || 0);
        const outstanding = Math.max(0, totalFee - totalPaid);

        const data = {
            studentName : studentData.name        || '—',
            studentId   : studentData.id          || '—',
            course      : item.Course?.name       || item.courseName || 'N/A',
            amount      : Number(item.amount      || 0),
            balance     : outstanding             || Number(item.amount || 0),
            method      : 'Installment',
            date        : item.dueDate            || item.date || new Date().toISOString(),
            receiptNo   : item.receiptNo          || `VCH-${item.id || Date.now()}`,
        };
        generateReceipt(data, 'NOT PAID', settings);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-96 space-y-4">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-[#2B5CE6] rounded-full animate-spin" />
                <div className="text-slate-400 font-bold text-xs">Loading dashboard...</div>
            </div>
        );
    }

    if (!studentData) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-500 font-bold">
                Student record not found. Please contact administration.
            </div>
        );
    }

    // Dynamic course filters based on student's actual enrollments/requests
    const dynamicFilters = ['All courses', ...new Set(
        enrollments.map(e => e.category || (e.Course?.name?.toLowerCase().includes('design') ? 'Design' : 
                            e.Course?.name?.toLowerCase().includes('business') ? 'Business' : 
                            e.Course?.name?.toLowerCase().includes('programming') ? 'Programming' : 'Tech'))
    )];

    const cardThemes = [
        { bg: 'bg-[#2B5CE6]', text: 'text-white', btn: 'bg-[#d8f030] text-black hover:bg-[#c9e020]' },
        { bg: 'bg-[#FF5A36]', text: 'text-white', btn: 'bg-[#d8f030] text-black hover:bg-[#c9e020]' },
        { bg: 'bg-[#1e1e1e]', text: 'text-white', btn: 'bg-[#d8f030] text-black hover:bg-[#c9e020]' },
        { bg: 'bg-[#10b981]', text: 'text-white', btn: 'bg-white text-black hover:bg-slate-100' },
        { bg: 'bg-[#8b5cf6]', text: 'text-white', btn: 'bg-[#d8f030] text-black hover:bg-[#c9e020]' },
    ];

    // Filter displayed courses dynamically
    const displayCourses = enrollments.filter(enr => {
        if (activeFilter === 'All courses') return true;
        const cat = enr.category || (enr.Course?.name?.toLowerCase().includes('design') ? 'Design' : 
                     enr.Course?.name?.toLowerCase().includes('business') ? 'Business' : 
                     enr.Course?.name?.toLowerCase().includes('programming') ? 'Programming' : 'Tech');
        return cat === activeFilter;
    });

    // Filter schedules locally based on input date
    const displaySchedules = schedules.filter(s => {
        if (!scheduleDateFilter) return true;
        return s.date === scheduleDateFilter;
    });

    // Unified ledger mappings
    const mappedPayments = payments.map(p => {
        const enr = enrollments.find(e => e.id === p.enrollmentId);
        return {
            id: `pay_${p.id}`,
            isPayment: true,
            receiptNo: p.receiptNo,
            date: p.paymentDate || p.createdAt,
            method: p.paymentMethod,
            amount: Number(p.amountPaid),
            balance: Number(p.remainingBalance),
            status: 'Paid',
            Course: enr?.Course || studentData?.Course
        };
    });

    const pendingInstallments = enrollments.flatMap(enr => 
        (enr.InstallmentSchedules || [])
            .filter(sch => sch.status === 'Pending')
            .map(sch => ({
                id: `sch_${sch.id}`,
                isInstallment: true,
                receiptNo: `VCH-${enr.id}-${sch.id}`,
                dueDate: sch.dueDate,
                method: 'Installment',
                amount: Number(sch.amount),
                status: 'Not Paid',
                Course: enr.Course
            }))
    );

    const combinedLedger = [...mappedPayments, ...pendingInstallments].sort((a, b) => {
        const dateA = new Date(a.date || a.dueDate);
        const dateB = new Date(b.date || b.dueDate);
        return dateB - dateA;
    });

    const filteredLedger = ledgerTab === 'all' ? combinedLedger :
                           ledgerTab === 'paid' ? mappedPayments :
                           pendingInstallments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            {/* Top Navigation Tabs */}
            <div className="flex flex-wrap gap-2 mb-8 bg-white p-2 rounded-2xl shadow-sm border border-slate-100 max-w-fit mt-2">
                {[
                    { id: 'learning', icon: BookOpen, label: 'My Learning' },
                    { id: 'financials', icon: CreditCard, label: 'Profile & Financials' },
                    { id: 'catalog', icon: PlusCircle, label: 'Browse Courses' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setMainTab(tab.id)}
                        className={cn(
                            "flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all",
                            mainTab === tab.id 
                                ? "bg-slate-900 text-white shadow-md transform -translate-y-0.5" 
                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                        )}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* TAB: MY LEARNING */}
            {mainTab === 'learning' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <h1 className="text-3xl font-semibold text-slate-800 font-sans tracking-tight">My courses</h1>
                        <div className="flex flex-wrap items-center gap-2">
                            {dynamicFilters.map((filter) => (
                                <button
                                    key={filter}
                                    onClick={() => setActiveFilter(filter)}
                                    className={cn(
                                        "px-5 py-2 rounded-full text-sm font-medium transition-all",
                                        activeFilter === filter 
                                            ? "bg-[#2B5CE6] text-white" 
                                            : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300"
                                    )}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {displayCourses.map((enr, idx) => {
                            const theme = cardThemes[idx % cardThemes.length];
                            const pct = enr.completionPercentage || 0;
                            const cat = enr.category || (enr.Course?.name?.includes('Design') ? 'Design' : 'Tech');
                            const comp = enr.lessonsCompleted || Math.floor((pct/100) * 30);
                            const total = enr.totalLessons || 30;

                            return (
                                <div 
                                    key={enr.id} 
                                    onClick={() => setSelectedCourseForModal(enr)}
                                    className={cn(`${theme.bg} ${theme.text} p-6 rounded-[2rem] flex flex-col justify-between min-h-[260px] relative overflow-hidden group shadow-sm cursor-pointer hover:shadow-xl transition-all duration-300`)}
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <span className="px-3 py-1 bg-black/20 rounded-full text-xs font-medium backdrop-blur-sm">
                                                {cat}
                                            </span>
                                            <Bookmark size={20} className="opacity-80" />
                                        </div>
                                        <h3 className="text-[1.35rem] font-medium leading-tight mb-2">
                                            {enr.Course?.name}
                                        </h3>
                                        <div className="flex flex-wrap gap-2 mb-6">
                                            <span className="px-2 py-0.5 bg-white/20 rounded text-[10px] font-black uppercase tracking-wider">
                                                {enr.Course?.duration || 'Flexible'}
                                            </span>
                                            <span className="px-2 py-0.5 bg-emerald-500/25 text-emerald-100 rounded text-[10px] font-black uppercase tracking-wider">
                                                Status: {enr.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between text-xs font-medium opacity-80 mb-2">
                                                <span>Progress</span>
                                                <span>{comp}/{total} lessons</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                                                <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between pt-2">
                                            <div className="flex -space-x-2">
                                                {[1, 2, 3].map(i => (
                                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-transparent relative z-10 overflow-hidden" style={{ borderColor: theme.bg }}>
                                                        <img src={`https://i.pravatar.cc/150?u=${idx * 10 + i}`} alt="Avatar" className="w-full h-full object-cover" />
                                                    </div>
                                                ))}
                                                <div className="w-8 h-8 rounded-full bg-white text-slate-800 text-[9px] font-bold flex items-center justify-center border-2 border-transparent z-0" style={{ borderColor: theme.bg }}>
                                                    +{enr.peers || 42}
                                                </div>
                                            </div>
                                            <button className={cn(`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${theme.btn}`)}>
                                                Course Hub
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {displayCourses.length === 0 && (
                            <div className="col-span-12 py-20 text-center flex flex-col items-center bg-white border border-slate-100 rounded-[2rem]">
                                <BookOpen size={48} className="text-slate-300 mb-2" />
                                <p className="text-slate-400 font-bold">You are not enrolled in any courses in this category.</p>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                        {/* Class Schedules Grid */}
                        <div className="xl:col-span-2">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-800">Class Schedules</h2>
                                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">{displaySchedules.length} Classes Scheduled</span>
                                </div>
                                
                                {/* Interactive Calendar Filter */}
                                <div className="flex items-center gap-3 bg-white p-2 border border-slate-100 rounded-2xl">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-2">Filter Date:</span>
                                    <input
                                        type="date"
                                        value={scheduleDateFilter}
                                        onChange={(e) => setScheduleDateFilter(e.target.value)}
                                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-600 outline-none focus:border-[#2B5CE6] transition-all cursor-pointer"
                                    />
                                    {scheduleDateFilter && (
                                        <button 
                                            onClick={() => setScheduleDateFilter('')}
                                            className="text-xs font-bold text-rose-500 hover:text-rose-700 pr-2"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4 max-h-[350px] overflow-y-auto standard-scrollbar pr-1">
                                <div className="grid grid-cols-12 text-[10px] font-black text-slate-400 uppercase tracking-wider pb-2 px-2">
                                    <div className="col-span-6">Class details</div>
                                    <div className="col-span-3">Date</div>
                                    <div className="col-span-3 text-right">Timing</div>
                                </div>
                                {displaySchedules.map((schedule) => (
                                    <div key={schedule.id} className="grid grid-cols-12 items-center bg-white border border-slate-100 p-4 rounded-2xl hover:shadow-sm transition-all">
                                        <div className="col-span-6 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-400">
                                                <Play size={14} className="ml-0.5" />
                                            </div>
                                            <div>
                                                <h4 className="text-slate-800 font-bold text-sm uppercase">{schedule.topic}</h4>
                                                <p className="text-slate-400 text-xs font-semibold uppercase">{schedule.Batch?.name}</p>
                                            </div>
                                        </div>
                                        <div className="col-span-3">
                                            <span className="text-slate-600 text-xs font-bold">
                                                {new Date(schedule.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                        <div className="col-span-3 text-right">
                                            <span className="px-2.5 py-1 text-[9px] font-black uppercase bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full">
                                                {schedule.startTime}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {displaySchedules.length === 0 && (
                                    <div className="text-center py-12 text-slate-400 bg-white border border-slate-100 rounded-2xl">
                                        <Calendar size={36} className="mx-auto mb-2 opacity-30 text-slate-400" />
                                        <p className="font-bold text-sm">No schedules logged for your enrolled courses</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* New Course Interest */}
                        <div className="bg-[#B9F529] p-8 rounded-[2rem] flex flex-col justify-between min-h-[300px]">
                            <div>
                                <p className="text-slate-800 font-medium text-sm mb-4">Course matching your interests</p>
                                <span className="bg-black text-white px-3 py-1 rounded-full text-xs font-medium">Design</span>
                                <h2 className="text-3xl lg:text-4xl font-medium text-slate-900 mt-6 leading-tight">
                                    Advanced Typography<br />for Digital Products
                                </h2>
                            </div>
                            <div className="mt-8">
                                <p className="text-sm font-medium text-slate-800 mb-3">They are already studying</p>
                                <div className="flex -space-x-2 mb-6">
                                    {[4, 5, 6].map(i => (
                                        <img key={i} src={`https://i.pravatar.cc/150?u=${i}`} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-[#B9F529]" />
                                    ))}
                                    <div className="w-10 h-10 rounded-full bg-white text-slate-800 text-xs font-bold flex items-center justify-center border-2 border-[#B9F529]">
                                        +100
                                    </div>
                                </div>
                                <button onClick={() => setMainTab('catalog')} className="w-full bg-[#FF5A36] hover:bg-[#e04523] text-white py-4 rounded-full font-medium transition-all shadow-sm">
                                    View Full Catalog
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: PROFILE & FINANCIALS */}
            {mainTab === 'financials' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h1 className="text-3xl font-semibold text-slate-800 font-sans tracking-tight">Profile & Financials</h1>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Profile Section */}
                        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex flex-col items-center text-center">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#2B5CE6] to-[#8b5cf6] flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-lg shadow-blue-200">
                                {studentData.name?.charAt(0)}
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800">{studentData.name}</h2>
                            <p className="text-slate-500 text-sm mb-6">{studentData.customId || 'Standard Student'}</p>
                            
                            <div className="w-full space-y-4 text-left">
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                    <Mail className="text-slate-400" size={18} />
                                    <span className="text-sm font-medium text-slate-700">{studentData.email || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                    <Phone className="text-slate-400" size={18} />
                                    <span className="text-sm font-medium text-slate-700">{studentData.phone || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                    <MapPin className="text-slate-400" size={18} />
                                    <span className="text-sm font-medium text-slate-700">{studentData.address || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-emerald-50 text-emerald-700 rounded-xl">
                                    <CheckCircle className="text-emerald-500" size={18} />
                                    <span className="text-sm font-bold">Status: {studentData.status}</span>
                                </div>
                            </div>
                        </div>

                        {/* Financial Details Section */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                                {[
                                    { label: 'Total Fee', val: studentData.totalFee, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                                    { label: 'Discount', val: studentData.discount, color: 'text-rose-600', bg: 'bg-rose-50' },
                                    { label: 'Net Payable', val: (studentData.totalFee - (studentData.discount || 0)), color: 'text-blue-600', bg: 'bg-blue-50' },
                                    { label: 'Total Paid', val: studentData.totalPaid, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                    { label: 'Remaining', val: (studentData.totalFee - (studentData.discount || 0) - (studentData.totalPaid || 0)), color: 'text-amber-600', bg: 'bg-amber-50' },
                                ].map((stat, i) => (
                                    <div key={i} className={`p-4 rounded-2xl border border-white/50 shadow-sm flex flex-col justify-center ${stat.bg}`}>
                                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">{stat.label}</p>
                                        <p className={`text-base font-black ${stat.color}`}>Rs. {(stat.val || 0).toLocaleString()}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Payment Transaction Ledger Container */}
                            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 space-y-6">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 border-b border-slate-100 gap-4">
                                    <h3 className="text-xl font-semibold flex items-center gap-2 tracking-tight">
                                        <Receipt className="text-[#FF5A36]" size={20} />
                                        Payment Transaction Ledger
                                    </h3>
                                    
                                    {/* Categorization Tabs */}
                                    <div className="flex bg-slate-100 p-1 rounded-xl">
                                        {[
                                            { id: 'all', label: 'All Fees' },
                                            { id: 'paid', label: 'Paid Invoices' },
                                            { id: 'due', label: 'Due/Pending Vouchers' }
                                        ].map(tab => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setLedgerTab(tab.id)}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all tracking-wider",
                                                    ledgerTab === tab.id 
                                                        ? "bg-white text-slate-800 shadow-sm" 
                                                        : "text-slate-400 hover:text-slate-700"
                                                )}
                                            >
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Receipt / Voucher</th>
                                                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Course</th>
                                                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date / Due Date</th>
                                                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Method</th>
                                                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredLedger.map((item) => (
                                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-4 py-3.5 font-bold text-slate-800 uppercase tracking-wider">{item.receiptNo}</td>
                                                    <td className="px-4 py-3.5 font-semibold text-slate-700">{item.Course?.name || 'N/A'}</td>
                                                    <td className="px-4 py-3.5 text-slate-500 font-medium">
                                                        {new Date(item.date || item.dueDate).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-black uppercase">
                                                            {item.method}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5 font-black text-slate-800">
                                                        Rs. {item.amount?.toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <span className={cn(
                                                            "px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-full border",
                                                            item.status === 'Paid' 
                                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                                                                : 'bg-rose-50 text-rose-600 border-rose-200'
                                                        )}>
                                                            {item.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-center">
                                                        {item.status === 'Paid' ? (
                                                            <button
                                                                onClick={() => handleDownloadSlip(item)}
                                                                className="group relative p-2 bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-lg transition-all duration-200 inline-flex items-center gap-1.5 shadow-sm hover:shadow-md active:scale-95"
                                                                title="Print 3-Copy Receipt (A4 Landscape)"
                                                            >
                                                                <Printer size={14} />
                                                                {/* Tooltip */}
                                                                <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-800 text-white text-[10px] font-semibold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                                                    Print Receipt
                                                                </span>
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleDownloadVoucher(item)}
                                                                className="group relative p-2 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-lg transition-all duration-200 inline-flex items-center gap-1.5 shadow-sm hover:shadow-md active:scale-95"
                                                                title="Print 3-Copy Fee Voucher (A4 Landscape)"
                                                            >
                                                                <Printer size={14} />
                                                                {/* Tooltip */}
                                                                <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-800 text-white text-[10px] font-semibold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                                                    Print Voucher
                                                                </span>
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredLedger.length === 0 && (
                                                <tr>
                                                    <td colSpan="7" className="text-center py-12 text-slate-400">
                                                        <div className="flex flex-col items-center justify-center gap-2">
                                                            <Receipt size={32} className="opacity-30 text-slate-400" />
                                                            <p className="font-bold">No transactions found in this ledger filter.</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                                    <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50">
                                        <p className="text-xs text-slate-400 capitalize mb-1">Total Installments Allowed</p>
                                        <p className="text-lg font-semibold text-slate-800">{studentData.totalInstallments}</p>
                                    </div>
                                    <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50">
                                        <p className="text-xs text-slate-400 capitalize mb-1">Next Payment Due Date</p>
                                        <p className="text-lg font-semibold text-slate-800">
                                            {studentData.next_due_date ? new Date(studentData.next_due_date).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'No pending dues'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: BROWSE COURSES */}
            {mainTab === 'catalog' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h1 className="text-3xl font-semibold text-slate-800 font-sans tracking-tight">Course Catalog</h1>
                    <p className="text-slate-500 max-w-2xl">Browse the latest courses available at the institute and easily enroll into new programs. Learn the most in-demand skills.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {availableCourses.length > 0 ? availableCourses.map((course, idx) => {
                            const theme = cardThemes[idx % cardThemes.length];
                            
                            // Check if student is already enrolled or requested
                            const isEnrolled = enrollments.some(e => e.Course?.id === course.id || e.courseId === course.id);

                            return (
                                <div key={course.id} className={cn("bg-white border border-slate-200 p-6 rounded-[2rem] flex flex-col justify-between min-h-[220px] hover:shadow-xl transition-all")}>
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <span className={cn("px-3 py-1 rounded-full text-xs font-bold", theme.bg, theme.text)}>
                                                {course.code || 'COUR'}
                                            </span>
                                            <span className="font-bold text-amber-500">Rs. {course.fee?.toLocaleString()}</span>
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-800 leading-tight mb-2">
                                            {course.name}
                                        </h3>
                                        <p className="text-slate-500 text-sm flex items-center gap-2">
                                            <Clock size={14} /> {course.duration || 'Flexible Duration'}
                                        </p>
                                    </div>
                                    <div className="mt-8">
                                        {isEnrolled ? (
                                            <button disabled className="w-full bg-slate-100 text-slate-400 py-3 rounded-xl font-bold flex items-center justify-center gap-2 cursor-not-allowed">
                                                <CheckCircle size={18} /> Active or Applied
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => handleEnroll(course.id)}
                                                disabled={enrolling}
                                                className={cn("w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm", theme.bg, theme.text, "hover:opacity-90 active:scale-95")}
                                            >
                                                <PlusCircle size={18} /> 
                                                {enrolling ? 'Enrolling...' : 'Apply for Course'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        }) : (
                            <div className="col-span-12 py-20 text-center flex flex-col items-center gap-4">
                                <BookOpen size={48} className="text-slate-300" />
                                <p className="text-lg text-slate-400 font-medium">No courses available at the moment.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {/* Live Class Indicator (if available) - Global over all tabs */}
            {liveClass && (
                <div className="fixed bottom-6 right-6 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 max-w-sm flex gap-4 items-start z-50 animate-in slide-in-from-bottom">
                    <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                        <Video size={20} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-red-400 font-bold text-xs uppercase tracking-widest">Live Now</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                        </div>
                        <h4 className="font-medium text-sm">{liveClass.topic}</h4>
                        {liveClass.classLink && (
                            <a href={liveClass.classLink} target="_blank" rel="noreferrer" className="mt-3 inline-block px-4 py-2 bg-white text-slate-900 text-xs font-bold rounded-lg hover:bg-slate-100 transition-colors">
                                Join Session
                            </a>
                        )}
                    </div>
                </div>
            )}

            {/* Smart Class Counter & Course Details Modal */}
            {selectedCourseForModal && (() => {
                const stats = calculateClassStats(selectedCourseForModal);
                return (
                    <Modal
                        isOpen={!!selectedCourseForModal}
                        onClose={() => { setSelectedCourseForModal(null); setQuestionText(''); }}
                        title={`Course Hub: ${selectedCourseForModal.Course?.name || 'Academic Details'}`}
                        maxWidth="max-w-xl"
                    >
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-center">
                                    <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Classes Held to Date</h4>
                                    <p className="text-3xl font-black text-indigo-700">{stats.totalHeld}</p>
                                    <p className="text-[10px] text-indigo-400 font-bold mt-1">Based on start date</p>
                                </div>
                                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-center">
                                    <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Remaining Classes</h4>
                                    <p className="text-3xl font-black text-amber-700">{stats.remaining}</p>
                                    <p className="text-[10px] text-amber-400 font-bold mt-1">Out of {stats.total} total classes</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Schedule Summary</h4>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 font-bold">Weekly Class Frequency</span>
                                    <span className="font-bold text-slate-800">{stats.frequency} Classes/Week</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 font-bold">Commencement Date</span>
                                    <span className="font-bold text-slate-800">
                                        {new Date(selectedCourseForModal.enrollmentDate || studentData?.commencementDate || new Date()).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                    </span>
                                </div>
                            </div>

                            {/* Instructor Bridge section */}
                            <div className="border-t border-slate-100 pt-6 space-y-4">
                                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
                                    <MessageSquare size={16} className="text-[#2B5CE6]" />
                                    Instructor Communication Bridge
                                </h4>
                                <p className="text-xs text-slate-400">Have a query? Ask the course instructors directly. Type your message below to send an internal chat directly to their dashboard.</p>
                                <textarea
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:border-[#2B5CE6] transition-all resize-none h-24"
                                    placeholder="Enter your question for the instructor here..."
                                    value={questionText}
                                    onChange={(e) => setQuestionText(e.target.value)}
                                />
                                <button
                                    onClick={handleAskQuestion}
                                    disabled={sendingQuestion || !questionText.trim()}
                                    className="w-full bg-[#2B5CE6] hover:bg-[#1a4cd5] text-white py-3.5 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
                                >
                                    {sendingQuestion ? 'Dispatched message...' : 'I have some questions'}
                                </button>
                            </div>
                        </div>
                    </Modal>
                );
            })()}
        </div>
    );
};

export default StudentDashboard;
