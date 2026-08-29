import React, { useState, useEffect } from 'react';
import {
    DollarSign,
    Calendar,
    User,
    Plus,
    Search,
    Briefcase,
    CreditCard,
    CheckCircle2,
    XCircle,
    AlertCircle,
    CalendarDays
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import apiClient from '../utils/api';
import { cn } from '../utils/cn';

const Payroll = () => {
    const [staffList, setStaffList] = useState([]);
    const [selectedStaff, setSelectedStaff] = useState('');
    const [payrollHistory, setPayrollHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(false);

    const [formData, setFormData] = useState({
        month: new Date().toISOString().slice(0, 7), // YYYY-MM format
        basePay: '',
        status: 'PENDING',
        disbursalDate: new Date().toISOString().split('T')[0]
    });

    const [submitting, setSubmitting] = useState(false);

    // Fetch staff list on load
    useEffect(() => {
        const fetchStaff = async () => {
            try {
                setLoading(true);
                const response = await apiClient.getUsers();
                // Filter out students
                const staff = (response.users || []).filter(
                    (u) => u.role !== 'Student' && !u.isStudent
                );
                setStaffList(staff);
                if (staff.length > 0) {
                    setSelectedStaff(staff[0].id);
                }
            } catch (error) {
                console.error('Failed to load staff list:', error);
                toast.error('Failed to load staff list');
            } finally {
                setLoading(false);
            }
        };

        fetchStaff();
    }, []);

    // Fetch payroll history when selected staff changes
    useEffect(() => {
        if (!selectedStaff) return;

        const fetchHistory = async () => {
            try {
                setHistoryLoading(true);
                const data = await apiClient.getPayrollByStaff(selectedStaff);
                setPayrollHistory(data || []);
            } catch (error) {
                console.error('Failed to load payroll history:', error);
                toast.error('Failed to load payroll history');
            } finally {
                setHistoryLoading(false);
            }
        };

        fetchHistory();
    }, [selectedStaff]);

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!selectedStaff) {
            toast.error('Please select a staff member');
            return;
        }
        if (!formData.basePay || parseFloat(formData.basePay) <= 0) {
            toast.error('Please enter a valid base pay amount');
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                staffId: parseInt(selectedStaff, 10),
                month: formData.month,
                basePay: parseFloat(formData.basePay),
                status: formData.status,
                disbursalDate: formData.status === 'PAID' ? formData.disbursalDate : null
            };

            await apiClient.createOrUpdatePayroll(payload);
            toast.success('Payroll record logged successfully');
            
            // Refresh history
            const data = await apiClient.getPayrollByStaff(selectedStaff);
            setPayrollHistory(data || []);
            
            // Reset basePay
            setFormData(prev => ({
                ...prev,
                basePay: ''
            }));
        } catch (error) {
            console.error('Failed to save payroll record:', error);
            toast.error(error.response?.data?.error || 'Failed to save payroll record');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="h-[80vh] flex items-center justify-center font-black text-slate-300 animate-pulse uppercase tracking-[0.5em]">
                Loading Payroll Systems...
            </div>
        );
    }

    const currentSelectedUser = staffList.find(s => s.id === parseInt(selectedStaff));

    return (
        <div className="space-y-12 animate-in fade-in duration-500 pb-20 pt-8">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                    <span className="text-[10px] font-black text-secondary uppercase tracking-[0.4em]">Administration Deck</span>
                </div>
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-800 tracking-tighter">Payroll Manager</h2>
                <p className="text-slate-400 mt-2 font-black uppercase text-[10px] tracking-widest italic opacity-60">
                    Disburse salaries, view compensation history, and manage staff pay scales.
                </p>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Column */}
                <div className="glass-card p-8 bg-white space-y-6 self-start">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                        <CreditCard className="text-secondary" size={20} />
                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-wider">Log Disbursement</h3>
                    </div>

                    <form onSubmit={handleFormSubmit} className="space-y-5">
                        {/* Select Worker */}
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Staff Member</label>
                            <div className="relative mt-1">
                                <select
                                    className="input-field bg-white"
                                    value={selectedStaff}
                                    onChange={(e) => setSelectedStaff(e.target.value)}
                                    required
                                >
                                    {staffList.map((staff) => (
                                        <option key={staff.id} value={staff.id}>
                                            {staff.name} ({staff.role})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Specialty Display if exists */}
                        {currentSelectedUser?.specialty && (
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center gap-2.5">
                                <Briefcase size={16} className="text-slate-400" />
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Specialty</p>
                                    <p className="text-xs font-bold text-slate-700 mt-0.5">{currentSelectedUser.specialty}</p>
                                </div>
                            </div>
                        )}

                        {/* Month Picker */}
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Target Month</label>
                            <input
                                type="month"
                                className="input-field mt-1"
                                value={formData.month}
                                onChange={(e) => setFormData(prev => ({ ...prev, month: e.target.value }))}
                                required
                            />
                        </div>

                        {/* Base Pay */}
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Base Pay Amount (Rs.)</label>
                            <div className="relative mt-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">Rs.</span>
                                <input
                                    type="number"
                                    placeholder="50000"
                                    className="input-field pl-10"
                                    value={formData.basePay}
                                    onChange={(e) => setFormData(prev => ({ ...prev, basePay: e.target.value }))}
                                    required
                                />
                            </div>
                        </div>

                        {/* Status Select */}
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Payment Status</label>
                            <select
                                className="input-field mt-1 bg-white"
                                value={formData.status}
                                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                                required
                            >
                                <option value="PENDING">PENDING</option>
                                <option value="PAID">PAID</option>
                            </select>
                        </div>

                        {/* Disbursal Date - Conditionally render if status is PAID */}
                        {formData.status === 'PAID' && (
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Disbursal Date</label>
                                <input
                                    type="date"
                                    className="input-field mt-1"
                                    value={formData.disbursalDate}
                                    onChange={(e) => setFormData(prev => ({ ...prev, disbursalDate: e.target.value }))}
                                    required
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="btn-secondary w-full py-4 font-black mt-4 uppercase tracking-wider disabled:opacity-50"
                        >
                            {submitting ? 'Processing...' : 'Record Payment'}
                        </button>
                    </form>
                </div>

                {/* History Matrix Column */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center gap-2">
                        <CalendarDays className="text-indigo-500" size={20} />
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-wider">
                            Compensation Ledger for {currentSelectedUser?.name || 'Staff'}
                        </h3>
                    </div>

                    <div className="glass-card overflow-hidden">
                        {historyLoading ? (
                            <div className="p-12 text-center text-slate-400 animate-pulse font-black uppercase tracking-widest text-xs">
                                Loading Ledger Records...
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50/50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Month</th>
                                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Base Pay</th>
                                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Disbursed Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {payrollHistory.map((history) => (
                                            <tr key={history.id} className="hover:bg-slate-50/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className="font-black text-slate-800 uppercase text-sm">
                                                        {history.month}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-bold text-slate-700 text-sm">
                                                        Rs. {parseFloat(history.basePay).toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-full border ${
                                                        history.status === 'PAID'
                                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                                            : 'bg-amber-50 text-amber-600 border-amber-200'
                                                    }`}>
                                                        {history.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs font-bold text-slate-500">
                                                        {history.disbursalDate ? new Date(history.disbursalDate).toLocaleDateString() : 'N/A'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}

                                        {payrollHistory.length === 0 && (
                                            <tr>
                                                <td colSpan="4" className="text-center py-12 text-slate-400">
                                                    <AlertCircle size={40} className="mx-auto mb-3 opacity-30 text-slate-400" />
                                                    <p className="font-bold">No payment records logged for this staff member</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Payroll;
