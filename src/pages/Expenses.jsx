import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
    Wallet, Plus, Search, Filter, ArrowUpRight, ArrowDownRight, TrendingUp, Calendar, AlertCircle, X, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../components/layout/Modal';

const Expenses = () => {
    const { expenses, addExpense, deleteExpense, getStats, refreshFinancialStats, courses, batches, api } = useApp();
    const [activeTab, setActiveTab] = useState('expenses');
    const [collaborations, setCollaborations] = useState([]);
    const [showCollabModal, setShowCollabModal] = useState(false);
    const [newCollab, setNewCollab] = useState({ partnerName: '', courseId: '', batchId: '', payoutType: 'percentage', rateValue: '', status: 'Active' });
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [newExpense, setNewExpense] = useState({
        description: '',
        amount: '',
        category: 'Marketing',
        date: new Date().toISOString().split('T')[0]
    });

    const stats = getStats();

    const fetchCollaborations = async () => {
        try {
            const response = await api.get('/collaborations');
            setCollaborations(response.data || []);
        } catch (error) {
            console.error('Error fetching collaborations:', error);
        }
    };

    useEffect(() => {
        fetchCollaborations();
    }, []);

    const filteredExpenses = expenses.filter(e =>
        e.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await addExpense({ ...newExpense, amount: parseInt(newExpense.amount) });
        if (success) {
            await refreshFinancialStats(); // Refresh financial stats after adding expense
        }
        setShowModal(false);
        setNewExpense({ description: '', amount: '', category: 'Marketing', date: new Date().toISOString().split('T')[0] });
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
                status: newCollab.status
            };
            await api.post('/collaborations', payload);
            setShowCollabModal(false);
            setNewCollab({ partnerName: '', courseId: '', batchId: '', payoutType: 'percentage', rateValue: '', status: 'Active' });
            fetchCollaborations();
        } catch (error) {
            console.error('Error creating collaboration:', error);
            alert(error.response?.data?.error || 'Failed to create collaboration contract');
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-500 pb-20">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Financial Tracker</h2>
                    <p className="text-slate-400 mt-1 font-medium">Log daily operational costs and monitor burn rate.</p>
                </div>
                {activeTab === 'expenses' ? (
                    <button onClick={() => setShowModal(true)} className="btn-secondary flex items-center gap-2">
                        <Plus size={20} /> Log Expense
                    </button>
                ) : (
                    <button onClick={() => setShowCollabModal(true)} className="btn-secondary flex items-center gap-2">
                        <Plus size={20} /> Create Collaboration
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="glass-card p-8 bg-white border-l-8 border-rose-500 shadow-xl">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Monthly Burn</p>
                    <h4 className="text-3xl font-black text-slate-800">Rs. {stats.monthlyExpenses.toLocaleString()}</h4>
                    <div className="mt-4 flex items-center gap-2 text-rose-500 font-bold text-xs uppercase">
                        <ArrowDownRight size={14} /> Tracking All Logs
                    </div>
                </div>
                <div className="glass-card p-8 bg-slate-900 text-white shadow-2xl">
                    <p className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em] mb-1">Active Ledger</p>
                    <h4 className="text-3xl font-black">{expenses.length} Entries</h4>
                    <p className="mt-4 text-white/60 font-medium text-xs">Total volume recorded</p>
                </div>
                <div className="glass-card p-8 bg-secondary text-white shadow-2xl">
                    <p className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em] mb-1">Status</p>
                    <h4 className="text-3xl font-black tracking-tight">Production</h4>
                    <p className="mt-4 text-white/60 font-medium text-xs uppercase tracking-widest">Live Sync Active</p>
                </div>
            </div>

            {/* Tabs for switching between Expenses & Collaborations */}
            <div className="flex border-b border-slate-200">
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
                    Collaboration Contracts
                </button>
            </div>

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
                                        <th className="px-8 py-5 text-left">Category</th>
                                        <th className="px-8 py-5 text-right">Amount</th>
                                        <th className="px-8 py-5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredExpenses.map((expense) => (
                                        <tr key={expense.id || expense._id} className="hover:bg-slate-50/30 transition-colors">
                                            <td className="px-8 py-5 flex items-center gap-2 text-slate-400 font-bold text-sm">
                                                <Calendar size={14} /> {expense.date}
                                            </td>
                                            <td className="px-8 py-5 font-bold text-slate-800 text-sm">{expense.description}</td>
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
                                                            await refreshFinancialStats(); // Refresh financial stats after deleting expense
                                                        }
                                                    }} 
                                                    className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredExpenses.length === 0 && (
                                        <tr key="no-expenses"><td colSpan="5" className="text-center py-20 text-slate-400 font-bold uppercase text-xs tracking-[0.3em]">No records found</td></tr>
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
                                                                        await api.put(`/collaborations/${collab.id}`, { status: newStatus });
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
                                                                            await api.delete(`/collaborations/${collab.id}`);
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
        </div>
    );
};

export default Expenses;
