import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
    Calendar,
    DollarSign,
    Layers,
    Award,
    Clock,
    BookOpen,
    CheckCircle2,
    XCircle,
    AlertCircle,
    CalendarRange
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import apiClient from '../utils/api';

const StaffDashboard = () => {
    const { user } = useApp();
    const [batches, setBatches] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [payroll, setPayroll] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStaffData = async () => {
            try {
                setLoading(true);
                const [batchesData, schedulesRes, payrollData] = await Promise.all([
                    apiClient.getBatches(),
                    apiClient.getSchedules(),
                    apiClient.getMyPayroll()
                ]);
                setBatches(batchesData || []);
                setSchedules(schedulesRes?.schedules || []);
                setPayroll(payrollData || []);
            } catch (error) {
                console.error('Failed to load staff dashboard data:', error);
                toast.error('Error loading dashboard data');
            } finally {
                setLoading(false);
            }
        };

        fetchStaffData();
    }, []);

    if (loading) {
        return (
            <div className="h-[80vh] flex items-center justify-center font-black text-slate-300 animate-pulse uppercase tracking-[0.5em]">
                Loading Staff Portal...
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-in fade-in duration-500 pb-20 pt-8">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden border border-slate-800">
                <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl -mr-20 -mt-20" />
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="px-3 py-1 bg-secondary/20 text-secondary text-xs font-black uppercase tracking-widest rounded-full border border-secondary/30">
                                Staff Portal
                            </span>
                            {user?.specialty && (
                                <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-black uppercase tracking-widest rounded-full border border-indigo-500/30">
                                    {user.specialty}
                                </span>
                            )}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
                            Welcome Back, {user?.name || 'Instructor'}!
                        </h1>
                        <p className="text-slate-400 mt-2 font-medium max-w-xl">
                            Here is your teaching schedule, assigned academic batches, and salary disbursements history ledger.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 min-w-[120px] text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Batches</p>
                            <p className="text-2xl font-black text-white mt-1">{batches.length}</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 min-w-[120px] text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Schedules</p>
                            <p className="text-2xl font-black text-white mt-1">{schedules.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dashboard Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left side: Batches and Schedules */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Active Batches Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Layers className="text-secondary" size={20} />
                            <h2 className="text-xl font-black text-slate-800 uppercase tracking-wider">My Assigned Batches</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {batches.map((batch) => (
                                <div key={batch.id} className="glass-card hover:translate-y-[-2px] transition-all bg-white border-l-4 border-l-secondary p-6">
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded text-[9px] font-black uppercase tracking-widest block w-fit mb-2">
                                        {batch.Course?.code || 'COURSE'}
                                    </span>
                                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-4">
                                        {batch.name}
                                    </h3>
                                    <div className="space-y-2.5 text-sm text-slate-500 font-bold">
                                        <div className="flex items-center gap-2">
                                            <Clock size={14} className="text-slate-400" />
                                            <span>Time: {batch.time || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <BookOpen size={14} className="text-slate-400" />
                                            <span>Course: {batch.Course?.name || 'N/A'}</span>
                                        </div>
                                    </div>
                                    {batch.meetingLink && (
                                        <a
                                            href={batch.meetingLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-4 inline-flex items-center justify-center w-full px-4 py-2.5 bg-secondary text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-secondary/20 hover:bg-secondary/90 transition-colors"
                                        >
                                            Join Meeting
                                        </a>
                                    )}
                                </div>
                            ))}
                            {batches.length === 0 && (
                                <div className="col-span-full glass-card p-12 text-center text-slate-400">
                                    <Layers size={40} className="mx-auto mb-3 opacity-30 text-slate-400" />
                                    <p className="font-bold">No active batches assigned</p>
                                    <p className="text-xs mt-1">Please contact the administrator to assign batches to you.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Classes Schedule Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <CalendarRange className="text-indigo-500" size={20} />
                            <h2 className="text-xl font-black text-slate-800 uppercase tracking-wider">My Teaching Schedule</h2>
                        </div>

                        <div className="glass-card overflow-hidden">
                            <div className="max-h-[350px] overflow-y-auto standard-scrollbar divide-y divide-slate-100">
                                {schedules.map((schedule) => (
                                    <div key={schedule.id} className="p-4 hover:bg-slate-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-colors">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-black">
                                                    {schedule.Batch?.Course?.code || 'COURSE'}
                                                </span>
                                                <span className="text-xs font-black text-slate-600 uppercase">
                                                    {schedule.Batch?.name || 'Batch'}
                                                </span>
                                            </div>
                                            <p className="font-black text-slate-800 text-sm uppercase">
                                                {schedule.topic}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between sm:justify-end gap-6">
                                            <div className="text-left sm:text-right font-bold text-xs text-slate-500">
                                                <div className="flex items-center gap-1.5 justify-start sm:justify-end">
                                                    <Calendar size={12} className="text-slate-400" />
                                                    <span>{new Date(schedule.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 justify-start sm:justify-end mt-0.5">
                                                    <Clock size={12} className="text-slate-400" />
                                                    <span>{schedule.startTime} - {schedule.endTime}</span>
                                                </div>
                                            </div>
                                            <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-full border ${
                                                schedule.status === 'Completed'
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                                    : schedule.status === 'Cancelled'
                                                    ? 'bg-red-50 text-red-600 border-red-200'
                                                    : 'bg-indigo-50 text-indigo-600 border-indigo-200'
                                            }`}>
                                                {schedule.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {schedules.length === 0 && (
                                    <div className="p-12 text-center text-slate-400">
                                        <CalendarRange size={40} className="mx-auto mb-3 opacity-30 text-slate-400" />
                                        <p className="font-bold">No schedules classes found</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right side: Compensation Matrix */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <DollarSign className="text-emerald-500" size={20} />
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-wider">Salary Matrix</h2>
                    </div>

                    <div className="glass-card p-6 bg-gradient-to-br from-white to-slate-50/50 space-y-6">
                        <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-4">
                            <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center">
                                <DollarSign size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Disbursed (Paid)</p>
                                <p className="text-2xl font-black text-emerald-700">
                                    Rs. {payroll.filter(p => p.status === 'PAID').reduce((sum, p) => sum + parseFloat(p.basePay || 0), 0).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Salary Payment History</p>
                            
                            <div className="space-y-3 max-h-[380px] overflow-y-auto standard-scrollbar pr-1">
                                {payroll.map((pay) => (
                                    <div key={pay.id} className="border border-slate-100 bg-white rounded-2xl p-4 flex justify-between items-center hover:shadow-md transition-shadow">
                                        <div>
                                            <p className="font-black text-slate-800 text-sm uppercase">{pay.month}</p>
                                            <p className="text-xs font-bold text-slate-500 mt-0.5">
                                                Rs. {parseFloat(pay.basePay).toLocaleString()}
                                            </p>
                                            {pay.disbursalDate && (
                                                <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">
                                                    Paid: {new Date(pay.disbursalDate).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                        <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-full border ${
                                            pay.status === 'PAID'
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                                : 'bg-amber-50 text-amber-600 border-amber-200'
                                        }`}>
                                            {pay.status}
                                        </span>
                                    </div>
                                ))}

                                {payroll.length === 0 && (
                                    <div className="text-center py-12 text-slate-400">
                                        <AlertCircle size={32} className="mx-auto mb-2 opacity-35" />
                                        <p className="font-bold text-sm">No payroll records logged</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StaffDashboard;
