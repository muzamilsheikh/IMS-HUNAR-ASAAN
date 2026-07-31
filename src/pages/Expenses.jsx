import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
    Wallet, Plus, Search, Filter, ArrowUpRight, ArrowDownRight, TrendingUp, Calendar, AlertCircle, X, Trash2, DollarSign, Users, Layers, PieChart as PieChartIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../components/layout/Modal';

const Expenses = () => {
    const { expenses, addExpense, deleteExpense, getStats, refreshFinancialStats, refreshData, courses, batches, api, students } = useApp();
    const [activeTab, setActiveTab] = useState('analytics');
    const [collaborations, setCollaborations] = useState([]);
    const [showCollabModal, setShowCollabModal] = useState(false);
    const [newCollab, setNewCollab] = useState({ partnerName: '', courseId: '', batchId: '', payoutType: 'percentage', rateValue: '', status: 'Active' });
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [financialStats, setFinancialStats] = useState({
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        totalPending: 0
    });
    const [newExpense, setNewExpense] = useState({
        description: '',
        amount: '',
        category: 'Marketing',
        courseId: null,
        batchId: null,
        date: new Date().toISOString().split('T')[0]
    });

    const stats = getStats();

    const fetchFinancialStats = async () => {
        try {
            const res = await api.get('/stats/financial-dashboard');
            if (res.success && res.data) {
                setFinancialStats(res.data);
            }
        } catch (err) {
            console.error('Error fetching financial dashboard stats:', err);
        }
    };

    const fetchCollaborations = async () => {
        try {
            const response = await api.get('/collaborations');
            setCollaborations(Array.isArray(response) ? response : (response.data || []));
        } catch (error) {
            console.error('Error fetching collaborations:', error);
        }
    };

    useEffect(() => {
        fetchCollaborations();
        fetchFinancialStats();
    }, []);

    const [selectedBatchModal, setSelectedBatchModal] = useState(null);

    // Calculate Batch-wise Financial Breakdown
    const batchFinancials = batches.map(b => {
        const batchStudents = students.filter(s => {
            const sBatchId = s.batchId?.id || s.batchId?._id || s.batchId;
            return String(sBatchId) === String(b.id || b._id);
        });

        const grossIncome = batchStudents.reduce((sum, s) => sum + (Number(s.totalFee) || 0) - (Number(s.discount) || 0), 0);
        const collectedRevenue = batchStudents.reduce((sum, s) => sum + (Number(s.paidAmount) || 0), 0);

        const batchIdNum = Number(b.id || b._id);
        const courseIdNum = Number(b.courseId?.id || b.courseId?._id || b.courseId || 0);
        const bIdStr = String(b.id || b._id);
        const cIdStr = String(b.courseId?.id || b.courseId?._id || b.courseId || '');

        // Calculate specific expenses logged for this batch OR associated course
        const batchExpenseList = expenses.filter(e => {
            const matchesBatch = e.batchId && Number(e.batchId) === batchIdNum;
            const matchesCourse = e.courseId && !e.batchId && Number(e.courseId) === courseIdNum;
            return matchesBatch || matchesCourse;
        });

        const batchExpenses = batchExpenseList.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

        // Find all active collaborations for this batch or course
        const batchCollabs = collaborations.filter(c => 
            c.status === 'Active' && 
            (String(c.batchId) === bIdStr || (!c.batchId && String(c.courseId) === cIdStr))
        );

        let partnerShare = 0;
        batchCollabs.forEach(collab => {
            if (collab.payoutType === 'percentage') {
                partnerShare += (collectedRevenue * (Number(collab.rateValue) || 0)) / 100;
            } else if (collab.payoutType === 'fixed_per_student') {
                partnerShare += batchStudents.length * (Number(collab.rateValue) || 0);
            } else if (collab.payoutType === 'fixed_per_class') {
                partnerShare += Number(collab.rateValue) || 0;
            }
        });

        const netIncome = collectedRevenue - partnerShare - batchExpenses;

        return {
            batchId: b.id || b._id,
            batchName: b.name,
            courseName: b.Course?.name || courses.find(c => String(c.id || c._id) === cIdStr)?.name || 'Assigned Course',
            studentCount: batchStudents.length,
            grossIncome,
            collectedRevenue,
            partnerShare,
            batchExpenses,
            batchExpenseList,
            netIncome,
            batchCollabs
        };
    });

    const filteredExpenses = expenses.filter(e =>
        e.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.Batch?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.Course?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = async (e) => {
        e.preventDefault();

        const parsedBatchId = newExpense.batchId ? parseInt(newExpense.batchId, 10) : null;
        const parsedCourseId = newExpense.courseId ? parseInt(newExpense.courseId, 10) : null;

        // Validation guard: if NaN is passed
        if (newExpense.batchId && isNaN(parsedBatchId)) {
            alert('Invalid Batch ID selected. Please select a valid target batch.');
            return;
        }

        const payload = {
            description: newExpense.description,
            amount: parseInt(newExpense.amount, 10),
            category: newExpense.category,
            date: newExpense.date,
            courseId: parsedCourseId,
            batchId: parsedBatchId
        };

        console.log('🔍 Submitting Expense Payload:', payload);

        const success = await addExpense(payload);
        if (success) {
            await refreshData();
            await refreshFinancialStats();
            fetchFinancialStats();
            setShowModal(false);
            setNewExpense({ description: '', amount: '', category: 'Marketing', courseId: null, batchId: null, date: new Date().toISOString().split('T')[0] });
        }
    };

    const handleCollabSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                partnerName: newCollab.partnerName,
                courseId: newCollab.courseId ? parseInt(newCollab.courseId, 10) : null,
                batchId: newCollab.batchId ? parseInt(newCollab.batchId, 10) : null,
                payoutType: newCollab.payoutType,
                rateValue: parseFloat(newCollab.rateValue) || 0,
                status: newCollab.status || 'Active'
            };
            const response = await api.post('/collaborations', payload);
            setShowCollabModal(false);
            setNewCollab({ partnerName: '', courseId: '', batchId: '', payoutType: 'percentage', rateValue: '', status: 'Active' });
            await fetchCollaborations();
            await refreshFinancialStats();
            fetchFinancialStats();
        } catch (error) {
            console.error('Error creating collaboration:', error);
            alert(error.response?.data?.error || 'Failed to create collaboration contract');
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-500 pb-20">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Finances & Analytics</h2>
                    <p className="text-slate-400 mt-1 font-medium">Financial oversight, profit margins, operational expenses & partner payouts.</p>
                </div>
                {activeTab === 'expenses' ? (
                    <button onClick={() => setShowModal(true)} className="btn-secondary flex items-center gap-2">
                        <Plus size={20} /> Log Expense
                    </button>
                ) : activeTab === 'collaborations' ? (
                    <button onClick={() => setShowCollabModal(true)} className="btn-secondary flex items-center gap-2">
                        <Plus size={20} /> Create Collaboration
                    </button>
                ) : null}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="glass-card p-6 bg-white border-l-8 border-emerald-500 shadow-xl">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Total Collections</p>
                    <h4 className="text-2xl font-black text-slate-800">Rs. {(financialStats.totalRevenue || stats.totalRevenue || 0).toLocaleString()}</h4>
                    <div className="mt-2 flex items-center gap-1 text-emerald-600 font-bold text-xs uppercase">
                        <ArrowUpRight size={14} /> Realized Revenue
                    </div>
                </div>
                <div className="glass-card p-6 bg-white border-l-8 border-rose-500 shadow-xl">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Core Operational Costs</p>
                    <h4 className="text-2xl font-black text-slate-800">Rs. {(financialStats.totalExpenses || stats.monthlyExpenses || 0).toLocaleString()}</h4>
                    <div className="mt-2 flex items-center gap-1 text-rose-500 font-bold text-xs uppercase">
                        <ArrowDownRight size={14} /> Logged Expenses
                    </div>
                </div>
                <div className="glass-card p-6 bg-white border-l-8 border-amber-500 shadow-xl">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Pending Receivables</p>
                    <h4 className="text-2xl font-black text-slate-800">Rs. {(financialStats.totalPending || 0).toLocaleString()}</h4>
                    <div className="mt-2 flex items-center gap-1 text-amber-600 font-bold text-xs uppercase">
                        <TrendingUp size={14} /> Recovery Pipeline
                    </div>
                </div>
                <div className="glass-card p-6 bg-secondary text-white shadow-2xl">
                    <p className="text-[10px] font-black uppercase text-white/60 tracking-[0.2em] mb-1">Net Income</p>
                    <h4 className="text-2xl font-black italic">Rs. {(financialStats.netProfit || 0).toLocaleString()}</h4>
                    <p className="mt-2 text-white/80 font-bold text-xs uppercase tracking-widest">Bottom Line Profit</p>
                </div>
            </div>

            {/* Tabs for switching between Financial Analytics, Expenses & Collaborations */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('analytics')}
                    className={`px-8 py-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-all ${
                        activeTab === 'analytics'
                            ? 'border-secondary text-secondary'
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                >
                    Financial Analytics & Batch Breakdown
                </button>
                <button
                    onClick={() => setActiveTab('expenses')}
                    className={`px-8 py-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-all ${
                        activeTab === 'expenses'
                            ? 'border-secondary text-secondary'
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                >
                    Core Expenses
                </button>
                <button
                    onClick={() => setActiveTab('collaborations')}
                    className={`px-8 py-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-all ${
                        activeTab === 'collaborations'
                            ? 'border-secondary text-secondary'
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                >
                    Trainer & Partner Percentage Share
                </button>
            </div>

            {activeTab === 'analytics' && (
                <div className="space-y-8">
                    <div className="glass-card p-8 bg-white border border-slate-100 shadow-xl rounded-[2rem]">
                        <h4 className="font-black text-xl text-slate-800 mb-6 uppercase tracking-tight">Batch Financial Performance & Net Income</h4>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/80 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                        <th className="px-6 py-4">Batch Name</th>
                                        <th className="px-6 py-4">Course</th>
                                        <th className="px-6 py-4 text-center">Enrolled</th>
                                        <th className="px-6 py-4 text-right">Gross Business Value</th>
                                        <th className="px-6 py-4 text-right">Collections</th>
                                        <th className="px-6 py-4 text-right">Logged Expenses</th>
                                        <th className="px-6 py-4 text-right">Partner Share</th>
                                        <th className="px-6 py-4 text-right">Net Batch Income</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm">
                                    {batchFinancials.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="text-center py-12 text-slate-400 font-bold uppercase text-xs">
                                                No batch records found.
                                            </td>
                                        </tr>
                                    ) : (
                                        batchFinancials.map(bf => (
                                            <tr 
                                                key={bf.batchId} 
                                                onClick={() => setSelectedBatchModal(bf)}
                                                className="hover:bg-slate-50 transition-colors font-medium cursor-pointer group"
                                            >
                                                <td className="px-6 py-4 font-bold text-slate-800 group-hover:text-secondary flex items-center gap-2">
                                                    {bf.batchName}
                                                    <span className="text-[10px] bg-slate-100 text-slate-500 group-hover:bg-secondary/10 group-hover:text-secondary px-2 py-0.5 rounded font-black uppercase">View Details</span>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-slate-500 font-semibold">{bf.courseName}</td>
                                                <td className="px-6 py-4 text-center font-bold text-slate-700">{bf.studentCount}</td>
                                                <td className="px-6 py-4 text-right font-extrabold text-slate-700">Rs. {bf.grossIncome.toLocaleString()}</td>
                                                <td className="px-6 py-4 text-right font-extrabold text-emerald-600">Rs. {bf.collectedRevenue.toLocaleString()}</td>
                                                <td className="px-6 py-4 text-right font-extrabold text-rose-500">Rs. {bf.batchExpenses.toLocaleString()}</td>
                                                <td className="px-6 py-4 text-right font-extrabold text-amber-600">Rs. {bf.partnerShare.toLocaleString()}</td>
                                                <td className="px-6 py-4 text-right font-black text-secondary">Rs. {bf.netIncome.toLocaleString()}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'expenses' && (
                <>
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1 w-full">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search descriptions or categories..."
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl focus:bg-white border-transparent focus:ring-2 focus:ring-secondary/10 outline-none transition-all font-medium"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 px-6 border-l border-slate-100">
                            <Filter size={18} className="text-slate-400" />
                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Journal</span>
                        </div>
                    </div>

                    <div className="glass-card bg-white shadow-xl overflow-hidden border border-slate-100">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <th className="px-8 py-5 text-left">Date</th>
                                        <th className="px-8 py-5 text-left">Description</th>
                                        <th className="px-8 py-5 text-left">Target Batch / Course</th>
                                        <th className="px-8 py-5 text-left">Category</th>
                                        <th className="px-8 py-5 text-right">Amount</th>
                                        <th className="px-8 py-5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredExpenses.map((expense) => {
                                        let targetLabel = 'General Institute';
                                        if (expense.Batch?.name) {
                                            targetLabel = `Batch: ${expense.Batch.name}`;
                                        } else if (expense.Course?.name) {
                                            targetLabel = `Course: ${expense.Course.name}`;
                                        }

                                        return (
                                            <tr key={expense.id || expense._id} className="hover:bg-slate-50/30 transition-colors">
                                                <td className="px-8 py-5 flex items-center gap-2 text-slate-400 font-bold text-sm">
                                                    <Calendar size={14} /> {expense.date}
                                                </td>
                                                <td className="px-8 py-5 font-bold text-slate-800 text-sm">{expense.description}</td>
                                                <td className="px-8 py-5 text-xs font-extrabold text-secondary">{targetLabel}</td>
                                                <td className="px-8 py-5">
                                                    <span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                        {expense.category}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-right font-black text-rose-500">
                                                    - Rs. {expense.amount.toLocaleString()}
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <button 
                                                        onClick={async () => {
                                                            const success = await deleteExpense(expense.id || expense._id);
                                                            if (success) {
                                                                await refreshFinancialStats();
                                                            }
                                                        }} 
                                                        className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredExpenses.length === 0 && (
                                        <tr key="no-expenses"><td colSpan="6" className="text-center py-20 text-slate-400 font-bold uppercase text-xs tracking-[0.3em]">No records found</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'collaborations' && (
                <div className="space-y-6">
                    <div className="glass-card bg-white shadow-xl overflow-hidden border border-slate-100">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <th className="px-8 py-5 text-left">Partner Name</th>
                                        <th className="px-8 py-5 text-left">Course / Batch Target</th>
                                        <th className="px-8 py-5 text-right">Payout Structure</th>
                                        <th className="px-8 py-5 text-center">Status</th>
                                        <th className="px-8 py-5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {collaborations.length === 0 ? (
                                        <tr key="no-collabs">
                                            <td colSpan="5" className="px-8 py-10 text-center text-slate-400 font-bold uppercase text-xs tracking-[0.3em]">
                                                No active collaboration contracts found.
                                            </td>
                                        </tr>
                                    ) : (
                                        collaborations.map((collab) => {
                                            let targetName = 'All Enrollments';
                                            if (collab.Batch) {
                                                targetName = `Batch: ${collab.Batch.name}`;
                                            } else if (collab.Course) {
                                                targetName = `Course: ${collab.Course.name}`;
                                            }

                                            let payoutLabel = '';
                                            if (collab.payoutType === 'percentage') {
                                                payoutLabel = `${collab.rateValue}% Split`;
                                            } else if (collab.payoutType === 'fixed_per_student') {
                                                payoutLabel = `Rs. ${parseFloat(collab.rateValue).toLocaleString()} / Student`;
                                            } else if (collab.payoutType === 'fixed_per_class') {
                                                payoutLabel = `Rs. ${parseFloat(collab.rateValue).toLocaleString()} / Class`;
                                            }

                                            return (
                                                <tr key={collab.id || collab._id} className="hover:bg-slate-50/30 transition-colors">
                                                    <td className="px-8 py-5 font-bold text-slate-800">{collab.partnerName}</td>
                                                    <td className="px-8 py-5 text-xs font-semibold text-slate-500">{targetName}</td>
                                                    <td className="px-8 py-5 text-right font-black text-slate-700">{payoutLabel}</td>
                                                    <td className="px-8 py-5 text-center">
                                                        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                            collab.status === 'Active' 
                                                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                                                : 'bg-slate-100 text-slate-600'
                                                        }`}>
                                                            {collab.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <div className="flex gap-2 justify-end items-center">
                                                            <button 
                                                                onClick={async () => {
                                                                    const newStatus = collab.status === 'Active' ? 'Inactive' : 'Active';
                                                                    try {
                                                                        await api.put(`/collaborations/${collab.id || collab._id}`, { status: newStatus });
                                                                        fetchCollaborations();
                                                                    } catch (err) {
                                                                        console.error(err);
                                                                    }
                                                                }}
                                                                className="text-xs font-black uppercase tracking-wider text-slate-400 hover:text-secondary transition-colors"
                                                            >
                                                                Toggle Status
                                                            </button>
                                                            <span className="text-slate-200">|</span>
                                                            <button 
                                                                onClick={async () => {
                                                                    if (window.confirm('Delete contract?')) {
                                                                        try {
                                                                            await api.delete(`/collaborations/${collab.id || collab._id}`);
                                                                            fetchCollaborations();
                                                                        } catch (err) {
                                                                            console.error(err);
                                                                        }
                                                                    }
                                                                }}
                                                                className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
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
                </div>
            )}

            {/* Modals Section */}
            <AnimatePresence>
                {showModal && (
                    <Modal
                        isOpen={showModal}
                        onClose={() => setShowModal(false)}
                        title="Log Operation Cost"
                        maxWidth="max-w-md"
                    >
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Entry Date</label>
                                <input type="date" className="input-field" value={newExpense.date} onChange={e => setNewExpense({ ...newExpense, date: e.target.value })} required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Description</label>
                                <input placeholder="e.g. Fiber Internet Bill" className="input-field" value={newExpense.description} onChange={e => setNewExpense({ ...newExpense, description: e.target.value })} required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Associated Course (Optional)</label>
                                <select 
                                    className="input-field bg-white" 
                                    value={newExpense.courseId || ''} 
                                    onChange={e => {
                                        const val = e.target.value ? parseInt(e.target.value, 10) : null;
                                        setNewExpense({ ...newExpense, courseId: val, batchId: null });
                                    }}
                                >
                                    <option value="">General Institute Expense (No Course)</option>
                                    {courses.map(c => (
                                        <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Target Batch (Optional)</label>
                                <select 
                                    className="input-field bg-white" 
                                    value={newExpense.batchId || ''} 
                                    onChange={e => {
                                        const val = e.target.value ? parseInt(e.target.value, 10) : null;
                                        setNewExpense({ ...newExpense, batchId: val });
                                    }}
                                >
                                    <option value="">General Expense (All Batches)</option>
                                    {batches
                                        .filter(b => !newExpense.courseId || Number(b.courseId?.id || b.courseId?._id || b.courseId) === Number(newExpense.courseId))
                                        .map(b => (
                                            <option key={b.id || b._id} value={b.id || b._id}>{b.name}</option>
                                        ))
                                    }
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Category</label>
                                    <select className="input-field bg-white" value={newExpense.category} onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}>
                                        <option>Marketing</option>
                                        <option>Utilities</option>
                                        <option>Rent</option>
                                        <option>Salaries</option>
                                        <option>Maintenance</option>
                                        <option>Collaboration Share</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Amount (Rs.)</label>
                                    <input type="number" placeholder="5000" className="input-field" value={newExpense.amount} onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })} required />
                                </div>
                            </div>
                            <button type="submit" className="btn-secondary w-full py-4 text-base font-black tracking-tight mt-4 uppercase">
                                Confirm Log Entry
                            </button>
                        </form>
                    </Modal>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showCollabModal && (
                    <Modal
                        isOpen={showCollabModal}
                        onClose={() => {
                            setShowCollabModal(false);
                            setNewCollab({ partnerName: '', courseId: '', batchId: '', payoutType: 'percentage', rateValue: '', status: 'Active' });
                        }}
                        title="Draft Collaboration Agreement"
                        maxWidth="max-w-lg"
                    >
                        <form onSubmit={handleCollabSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Collaboration With (Partner Name)</label>
                                <input 
                                    required 
                                    className="input-field" 
                                    placeholder="e.g. OPHY CARE" 
                                    value={newCollab.partnerName} 
                                    onChange={e => setNewCollab({ ...newCollab, partnerName: e.target.value })} 
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Select Course</label>
                                <select 
                                    required
                                    className="input-field bg-white" 
                                    value={newCollab.courseId} 
                                    onChange={e => setNewCollab({ ...newCollab, courseId: e.target.value, batchId: '' })}
                                >
                                    <option value="">Select Target Course</option>
                                    {courses.map(c => (
                                        <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Select Batch (Optional)</label>
                                <select 
                                    className="input-field bg-white" 
                                    value={newCollab.batchId} 
                                    onChange={e => setNewCollab({ ...newCollab, batchId: e.target.value })}
                                >
                                    <option value="">Track Whole Course (All Batches)</option>
                                    {batches
                                        .filter(b => b.courseId?.id === parseInt(newCollab.courseId) || b.courseId === parseInt(newCollab.courseId) || b.courseId?._id === parseInt(newCollab.courseId))
                                        .map(b => (
                                            <option key={b.id || b._id} value={b.id || b._id}>{b.name}</option>
                                        ))
                                    }
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Payout Structure</label>
                                <select 
                                    required
                                    className="input-field bg-white" 
                                    value={newCollab.payoutType} 
                                    onChange={e => setNewCollab({ ...newCollab, payoutType: e.target.value, rateValue: '' })}
                                >
                                    <option value="percentage">Percentage Split (%)</option>
                                    <option value="fixed_per_student">Fixed Amount Per Student (PKR)</option>
                                    <option value="fixed_per_class">Fixed Rate Per Class (PKR)</option>
                                </select>
                            </div>

                            {newCollab.payoutType === 'percentage' && (
                                <div className="space-y-2 animate-in fade-in duration-200">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Collaboration Percentage (%)</label>
                                    <input 
                                        type="number" 
                                        required 
                                        min="1" 
                                        max="100" 
                                        step="0.01"
                                        className="input-field" 
                                        placeholder="e.g. 65" 
                                        value={newCollab.rateValue} 
                                        onChange={e => setNewCollab({ ...newCollab, rateValue: e.target.value })} 
                                    />
                                </div>
                            )}

                            {newCollab.payoutType === 'fixed_per_student' && (
                                <div className="space-y-2 animate-in fade-in duration-200">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Amount Per Enrolled Student (PKR)</label>
                                    <input 
                                        type="number" 
                                        required 
                                        min="0" 
                                        step="1"
                                        className="input-field" 
                                        placeholder="e.g. 2000" 
                                        value={newCollab.rateValue} 
                                        onChange={e => setNewCollab({ ...newCollab, rateValue: e.target.value })} 
                                    />
                                </div>
                            )}

                            {newCollab.payoutType === 'fixed_per_class' && (
                                <div className="space-y-2 animate-in fade-in duration-200">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Rate Per Conducted Class (PKR)</label>
                                    <input 
                                        type="number" 
                                        required 
                                        min="0" 
                                        step="1"
                                        className="input-field" 
                                        placeholder="e.g. 1500" 
                                        value={newCollab.rateValue} 
                                        onChange={e => setNewCollab({ ...newCollab, rateValue: e.target.value })} 
                                    />
                                </div>
                            )}

                            <button type="submit" className="btn-secondary w-full py-4 text-base font-black tracking-tight mt-4 uppercase">
                                Activate Contract
                            </button>
                        </form>
                    </Modal>
                )}
            </AnimatePresence>

            {/* Dynamic Batch Expense Details Popup Modal */}
            <AnimatePresence>
                {selectedBatchModal && (
                    <Modal
                        isOpen={!!selectedBatchModal}
                        onClose={() => setSelectedBatchModal(null)}
                        title={`Financial Breakdown — ${selectedBatchModal.batchName}`}
                        maxWidth="max-w-3xl"
                    >
                        <div className="space-y-6">
                            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <div>
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Target Course</p>
                                    <p className="font-extrabold text-slate-800 text-sm">{selectedBatchModal.courseName}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Enrolled</p>
                                    <p className="font-black text-secondary text-sm">{selectedBatchModal.studentCount} Students</p>
                                </div>
                            </div>

                            <div>
                                <h5 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3">Logged Expenses Linked to Batch/Course</h5>
                                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-50 font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                            <tr>
                                                <th className="px-4 py-3">Date</th>
                                                <th className="px-4 py-3">Description</th>
                                                <th className="px-4 py-3">Category</th>
                                                <th className="px-4 py-3 text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                                            {selectedBatchModal.batchExpenseList.length === 0 ? (
                                                <tr>
                                                    <td colSpan="4" className="text-center py-6 text-slate-400 font-bold uppercase text-[10px]">
                                                        No direct expenses logged for this batch/course.
                                                    </td>
                                                </tr>
                                            ) : (
                                                selectedBatchModal.batchExpenseList.map(exp => (
                                                    <tr key={exp.id || exp._id}>
                                                        <td className="px-4 py-3 text-slate-400">{exp.date}</td>
                                                        <td className="px-4 py-3 font-bold text-slate-800">{exp.description}</td>
                                                        <td className="px-4 py-3">
                                                            <span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-black uppercase text-slate-500">
                                                                {exp.category}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-black text-rose-500">
                                                            Rs. {Number(exp.amount || 0).toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Partner & Trainer Payout Share Ledger */}
                            <div>
                                <h5 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3">Partner & Trainer Share Ledger</h5>
                                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-50 font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                            <tr>
                                                <th className="px-4 py-3">Partner Name</th>
                                                <th className="px-4 py-3">Payout Structure</th>
                                                <th className="px-4 py-3 text-right">Calculated Share</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                                            {selectedBatchModal.batchCollabs.length === 0 ? (
                                                <tr>
                                                    <td colSpan="3" className="text-center py-6 text-slate-400 font-bold uppercase text-[10px]">
                                                        No active collaboration contracts for this batch/course.
                                                    </td>
                                                </tr>
                                            ) : (
                                                selectedBatchModal.batchCollabs.map(collab => {
                                                    let structureLabel = '';
                                                    let shareAmount = 0;
                                                    if (collab.payoutType === 'percentage') {
                                                        structureLabel = `${collab.rateValue}% Split (Collected: Rs. ${selectedBatchModal.collectedRevenue.toLocaleString()})`;
                                                        shareAmount = (selectedBatchModal.collectedRevenue * Number(collab.rateValue)) / 100;
                                                    } else if (collab.payoutType === 'fixed_per_student') {
                                                        structureLabel = `Rs. ${parseFloat(collab.rateValue).toLocaleString()} / Student (${selectedBatchModal.studentCount} Students)`;
                                                        shareAmount = selectedBatchModal.studentCount * Number(collab.rateValue);
                                                    } else if (collab.payoutType === 'fixed_per_class') {
                                                        structureLabel = `Rs. ${parseFloat(collab.rateValue).toLocaleString()} flat class / period`;
                                                        shareAmount = Number(collab.rateValue);
                                                    }
                                                    return (
                                                        <tr key={collab.id || collab._id}>
                                                            <td className="px-4 py-3 font-bold text-slate-800">{collab.partnerName}</td>
                                                            <td className="px-4 py-3 text-slate-500">{structureLabel}</td>
                                                            <td className="px-4 py-3 text-right font-black text-amber-600">
                                                                Rs. {shareAmount.toLocaleString()}
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Summary Footer Cards */}
                            <div className="grid grid-cols-4 gap-4 pt-4 border-t border-slate-100">
                                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                                    <p className="text-[9px] font-black uppercase text-emerald-500 tracking-wider">Realized Collections</p>
                                    <p className="text-sm font-black text-emerald-600">Rs. {selectedBatchModal.collectedRevenue.toLocaleString()}</p>
                                </div>
                                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-center">
                                    <p className="text-[9px] font-black uppercase text-rose-400 tracking-wider">Logged Expenses</p>
                                    <p className="text-sm font-black text-rose-600">Rs. {selectedBatchModal.batchExpenses.toLocaleString()}</p>
                                </div>
                                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-center">
                                    <p className="text-[9px] font-black uppercase text-amber-400 tracking-wider">Partner Payouts</p>
                                    <p className="text-sm font-black text-amber-600">Rs. {selectedBatchModal.partnerShare.toLocaleString()}</p>
                                </div>
                                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 text-center">
                                    <p className="text-[9px] font-black uppercase text-indigo-500 tracking-wider">Net Batch Income</p>
                                    <p className="text-sm font-black text-indigo-600">Rs. {selectedBatchModal.netIncome.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </Modal>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Expenses;
