import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Calendar as CalendarIcon, Clock, BookOpen, Layers, Plus, Edit3, Trash2, 
    ChevronLeft, ChevronRight, Filter, Search, Sparkles, Activity, CheckCircle, Info 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import Modal from '../components/layout/Modal';
import { cn } from '../utils/cn';
import apiClient from '../utils/api';
import toast from 'react-hot-toast';

const Calendar = () => {
    const { user, courses, batches } = useApp();
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // View state
    const [timeHorizon, setTimeHorizon] = useState('week'); // 'week', 'month', 'upcoming'
    const [selectedDate, setSelectedDate] = useState(new Date());
    
    // Filtering state
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [selectedBatchId, setSelectedBatchId] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    
    // Modal states
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        batchId: '',
        topic: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '10:00',
        endTime: '12:00',
        status: 'Scheduled'
    });

    useEffect(() => {
        fetchSchedules();
    }, [selectedCourseId, selectedBatchId]);

    const fetchSchedules = async () => {
        setLoading(true);
        try {
            const filters = {};
            if (selectedBatchId) filters.batchId = selectedBatchId;
            if (selectedCourseId) filters.courseId = selectedCourseId;
            
            const response = await apiClient.getSchedules(filters);
            if (response?.success) {
                setSchedules(response.schedules || []);
            }
        } catch (error) {
            console.error('Failed to load schedules:', error);
            toast.error('Failed to load schedules');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreateModal = () => {
        setEditingSchedule(null);
        setFormData({
            batchId: batches[0]?.id || '',
            topic: '',
            date: new Date().toISOString().split('T')[0],
            startTime: '10:00',
            endTime: '12:00',
            status: 'Scheduled'
        });
        setShowFormModal(true);
    };

    const handleOpenEditModal = (schedule) => {
        setEditingSchedule(schedule);
        setFormData({
            batchId: schedule.batchId || '',
            topic: schedule.topic || '',
            date: schedule.date || '',
            startTime: schedule.startTime || '10:00',
            endTime: schedule.endTime || '12:00',
            status: schedule.status || 'Scheduled'
        });
        setShowFormModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.batchId || !formData.topic || !formData.date || !formData.startTime || !formData.endTime) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingSchedule) {
                const response = await apiClient.updateSchedule(editingSchedule.id, formData);
                if (response?.success) {
                    toast.success('Schedule updated successfully');
                    setShowFormModal(false);
                    fetchSchedules();
                }
            } else {
                const response = await apiClient.createSchedule(formData);
                if (response?.success) {
                    toast.success('Schedule created successfully');
                    setShowFormModal(false);
                    fetchSchedules();
                }
            }
        } catch (error) {
            console.error('Save schedule error:', error);
            toast.error(error.response?.data?.error || 'Failed to save schedule');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (scheduleId) => {
        if (!window.confirm('Are you sure you want to delete this schedule?')) return;
        
        try {
            const response = await apiClient.deleteSchedule(scheduleId);
            if (response?.success) {
                toast.success('Schedule deleted');
                fetchSchedules();
            }
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete schedule');
        }
    };

    // Date navigation helpers
    const getWeekDays = (date) => {
        const start = new Date(date);
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        start.setDate(diff);
        
        const days = [];
        for (let i = 0; i < 7; i++) {
            const next = new Date(start);
            next.setDate(start.getDate() + i);
            days.push(next);
        }
        return days;
    };

    const formatMonthYear = (date) => {
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const changeDate = (direction) => {
        const newDate = new Date(selectedDate);
        if (timeHorizon === 'week') {
            newDate.setDate(selectedDate.getDate() + (direction * 7));
        } else if (timeHorizon === 'month') {
            newDate.setMonth(selectedDate.getMonth() + direction);
        } else {
            newDate.setDate(selectedDate.getDate() + direction);
        }
        setSelectedDate(newDate);
    };

    // RELATIONAL SIDEBAR & FILTERING CALCULATION
    const filteredSchedules = schedules.filter(sch => {
        const searchStr = searchQuery.toLowerCase();
        const topicMatch = sch.topic?.toLowerCase().includes(searchStr);
        const batchMatch = sch.Batch?.name?.toLowerCase().includes(searchStr);
        const courseMatch = sch.Batch?.Course?.name?.toLowerCase().includes(searchStr);
        return topicMatch || batchMatch || courseMatch;
    });

    const getHorizonFilteredSchedules = () => {
        if (timeHorizon === 'upcoming') {
            const today = new Date();
            today.setHours(0,0,0,0);
            return filteredSchedules.filter(sch => new Date(sch.date) >= today);
        }
        
        if (timeHorizon === 'month') {
            const month = selectedDate.getMonth();
            const year = selectedDate.getFullYear();
            return filteredSchedules.filter(sch => {
                const d = new Date(sch.date);
                return d.getMonth() === month && d.getFullYear() === year;
            });
        }
        
        // Week view filtering
        const weekDays = getWeekDays(selectedDate);
        const start = weekDays[0];
        const end = newDaysPlusTime(weekDays[6], 23, 59, 59);
        return filteredSchedules.filter(sch => {
            const d = new Date(sch.date);
            return d >= start && d <= end;
        });
    };

    const newDaysPlusTime = (date, h, m, s) => {
        const d = new Date(date);
        d.setHours(h, m, s);
        return d;
    };

    const renderWeekView = () => {
        const weekDays = getWeekDays(selectedDate);
        const currentHorizonSchedules = getHorizonFilteredSchedules();
        
        return (
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {weekDays.map((day, index) => {
                    const dateStr = day.toISOString().split('T')[0];
                    const daySchedules = currentHorizonSchedules.filter(sch => sch.date === dateStr);
                    const isToday = new Date().toISOString().split('T')[0] === dateStr;
                    
                    return (
                        <div 
                            key={index} 
                            className={cn(
                                "glass-card p-6 flex flex-col rounded-3xl min-h-[300px] border transition-all",
                                isToday 
                                    ? "bg-slate-900 text-white border-slate-800 shadow-2xl scale-[1.02]" 
                                    : "bg-white border-slate-100 shadow-lg"
                            )}
                        >
                            <div className="mb-4 flex justify-between items-center">
                                <div>
                                    <p className={cn("text-[10px] font-black uppercase tracking-widest", isToday ? "text-secondary" : "text-slate-400")}>
                                        {day.toLocaleDateString('en-US', { weekday: 'short' })}
                                    </p>
                                    <h4 className="text-xl font-black">{day.getDate()}</h4>
                                </div>
                                {isToday && (
                                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                                )}
                            </div>
                            
                            <div className="flex-1 space-y-3 overflow-y-auto max-h-[400px] scrollbar-hide">
                                {daySchedules.length > 0 ? (
                                    daySchedules.map(sch => (
                                        <div 
                                            key={sch.id}
                                            onClick={() => (user?.role === 'Admin' || user?.role === 'Staff') && handleOpenEditModal(sch)}
                                            className={cn(
                                                "p-4 rounded-2xl border transition-all cursor-pointer hover:translate-y-[-2px]",
                                                isToday 
                                                    ? "bg-white/10 border-white/10 hover:bg-white/20 text-white" 
                                                    : "bg-slate-50 border-slate-100 hover:border-secondary/20 hover:bg-secondary/5 text-slate-800"
                                            )}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-secondary truncate max-w-[80%]">
                                                    {sch.Batch?.Course?.code} - {sch.Batch?.name}
                                                </p>
                                                {sch.status === 'Cancelled' ? (
                                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                                ) : sch.status === 'Completed' ? (
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                ) : (
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                )}
                                            </div>
                                            <p className="text-xs font-bold line-clamp-2 leading-tight mb-2">{sch.topic}</p>
                                            <div className="flex items-center gap-1.5 text-[9px] font-semibold opacity-60">
                                                <Clock size={10} />
                                                <span>{sch.startTime} - {sch.endTime}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="h-full flex items-center justify-center border border-dashed border-slate-100 rounded-2xl p-6">
                                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-300 text-center">No classes scheduled</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderMonthView = () => {
        const currentHorizonSchedules = getHorizonFilteredSchedules();
        
        // Group schedules by date using local YYYY-MM-DD format
        const grouped = {};
        currentHorizonSchedules.forEach(sch => {
            if (!grouped[sch.date]) grouped[sch.date] = [];
            grouped[sch.date].push(sch);
        });

        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth();

        // First day of the month
        const firstDayOfMonth = new Date(year, month, 1);
        // Last day of the month
        const lastDayOfMonth = new Date(year, month + 1, 0);

        // Day of week for first day (0 = Sunday, 1 = Monday, etc.)
        // Monday = 0, Tuesday = 1, ... Sunday = 6
        let firstDayOfWeek = firstDayOfMonth.getDay();
        let leadingDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

        const gridDays = [];

        // Add leading days from the previous month
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = leadingDays - 1; i >= 0; i--) {
            gridDays.push({
                date: new Date(year, month - 1, prevMonthLastDay - i),
                isCurrentMonth: false
            });
        }

        // Add current month days
        const daysInMonth = lastDayOfMonth.getDate();
        for (let i = 1; i <= daysInMonth; i++) {
            gridDays.push({
                date: new Date(year, month, i),
                isCurrentMonth: true
            });
        }

        // Pad trailing days
        const totalCells = Math.ceil(gridDays.length / 7) * 7;
        const trailingDaysNeeded = totalCells - gridDays.length;
        for (let i = 1; i <= trailingDaysNeeded; i++) {
            gridDays.push({
                date: new Date(year, month + 1, i),
                isCurrentMonth: false
            });
        }

        const weekdayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        // Get local today date string
        const today = new Date();
        const todayYear = today.getFullYear();
        const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
        const todayDay = String(today.getDate()).padStart(2, '0');
        const todayStr = `${todayYear}-${todayMonth}-${todayDay}`;

        return (
            <div className="glass-card p-6 bg-white border border-slate-100 shadow-xl rounded-3xl w-full overflow-hidden">
                {/* Month Days Header Row */}
                <div className="grid grid-cols-7 gap-2 mb-4 text-center">
                    {weekdayNames.map(name => (
                        <div key={name} className="text-[10px] font-black text-slate-400 uppercase tracking-widest py-2">
                            {name}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid Cells */}
                <div className="grid grid-cols-7 gap-2 border border-slate-50 bg-slate-50/30 rounded-2xl p-2">
                    {gridDays.map((cell, idx) => {
                        const cellYear = cell.date.getFullYear();
                        const cellMonth = String(cell.date.getMonth() + 1).padStart(2, '0');
                        const cellDay = String(cell.date.getDate()).padStart(2, '0');
                        const dateStr = `${cellYear}-${cellMonth}-${cellDay}`;
                        
                        const daySchedules = grouped[dateStr] || [];
                        const isToday = todayStr === dateStr;
                        const dayNum = cell.date.getDate();

                        return (
                            <div
                                key={idx}
                                className={cn(
                                    "min-h-[110px] p-2 rounded-2xl flex flex-col justify-between transition-all border",
                                    cell.isCurrentMonth 
                                        ? isToday
                                            ? "bg-slate-900 text-white border-slate-800 shadow-lg scale-[1.02]"
                                            : "bg-white border-slate-100 hover:bg-slate-50 text-slate-800"
                                        : "bg-slate-100/50 border-slate-50 text-slate-300"
                                )}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className={cn(
                                        "text-xs font-black w-6 h-6 rounded-full flex items-center justify-center",
                                        isToday && "bg-secondary text-white shadow-sm"
                                    )}>
                                        {dayNum}
                                    </span>
                                    {isToday && (
                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                                    )}
                                </div>

                                <div className="flex-1 space-y-1 overflow-y-auto max-h-[80px] scrollbar-hide pt-1">
                                    {daySchedules.map(sch => (
                                        <div
                                            key={sch.id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (user?.role === 'Admin' || user?.role === 'Staff') {
                                                    handleOpenEditModal(sch);
                                                }
                                            }}
                                            className={cn(
                                                "px-2 py-1 rounded-lg text-[8px] font-black truncate cursor-pointer transition-transform hover:scale-95",
                                                isToday
                                                    ? "bg-white/10 text-white border border-white/10 hover:bg-white/20"
                                                    : "bg-secondary/10 text-secondary border border-secondary/5 hover:bg-secondary/20"
                                            )}
                                            title={`${sch.Batch?.name}: ${sch.topic}`}
                                        >
                                            <span className="block font-black truncate">{sch.Batch?.Course?.code || 'Class'}</span>
                                            <span className="block opacity-75 font-semibold truncate">{sch.startTime}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderUpcomingView = () => {
        const currentHorizonSchedules = getHorizonFilteredSchedules();
        
        return (
            <div className="space-y-4">
                {currentHorizonSchedules.map(sch => {
                    const dayDate = new Date(sch.date);
                    return (
                        <div 
                            key={sch.id}
                            onClick={() => (user?.role === 'Admin' || user?.role === 'Staff') && handleOpenEditModal(sch)}
                            className="glass-card p-6 rounded-3xl border border-slate-100 bg-white hover:border-secondary/20 transition-all flex flex-col md:flex-row gap-6 items-start md:items-center justify-between cursor-pointer"
                        >
                            <div className="flex items-center gap-4 min-w-[150px]">
                                <div className="w-12 h-12 rounded-2xl bg-secondary text-white flex flex-col items-center justify-center font-black">
                                    <span className="text-[8px] uppercase tracking-wider">{dayDate.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                    <span className="text-lg">{dayDate.getDate()}</span>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-800">{dayDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                                    <div className="flex items-center gap-1 mt-1 text-[8px] font-semibold text-slate-400">
                                        <Clock size={8} />
                                        <span>{sch.startTime} - {sch.endTime}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex-1">
                                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{sch.Batch?.Course?.name} — {sch.Batch?.name}</span>
                                <h4 className="text-lg font-black text-slate-800 mt-1">{sch.topic}</h4>
                            </div>
                            
                            <div className="flex items-center gap-4">
                                <span className={cn(
                                    "text-[9px] font-black uppercase px-3 py-1 rounded-full border",
                                    sch.status === 'Cancelled' ? 'bg-rose-50 border-rose-100 text-rose-500' :
                                    sch.status === 'Completed' ? 'bg-emerald-50 border-emerald-100 text-emerald-500' :
                                    'bg-blue-50 border-blue-100 text-blue-500'
                                )}>
                                    {sch.status}
                                </span>
                                {(user?.role === 'Admin' || user?.role === 'Staff') && (
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(sch.id);
                                        }}
                                        className="p-2 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-slate-50 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
                {currentHorizonSchedules.length === 0 && (
                    <div className="text-center py-20 bg-slate-50 rounded-[3rem] border border-slate-100">
                        <CalendarIcon className="w-16 h-16 text-slate-300 mx-auto mb-4 animate-bounce" />
                        <p className="text-slate-400 font-black uppercase text-xs tracking-[0.2em]">No upcoming classes found</p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-6 pb-20 w-full">
            {/* Relational Filters Row */}
            <div className="flex flex-wrap items-end gap-4 w-full bg-white p-6 rounded-3xl border border-slate-100 shadow-xl">
                <div className="flex-1 min-w-[200px] space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">Course Filter</label>
                    <select
                        className="input-field bg-white"
                        value={selectedCourseId}
                        onChange={(e) => {
                            setSelectedCourseId(e.target.value);
                            setSelectedBatchId(''); // reset batch
                        }}
                    >
                        <option value="">All Courses</option>
                        {courses.map(c => (
                            <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex-1 min-w-[200px] space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">Batch Filter</label>
                    <select
                        className="input-field bg-white"
                        value={selectedBatchId}
                        onChange={(e) => setSelectedBatchId(e.target.value)}
                        disabled={!selectedCourseId}
                    >
                        <option value="">All Batches</option>
                        {batches
                            .filter(b => {
                                const bCourseId = b.courseId?.id || b.courseId?._id || b.courseId;
                                return String(bCourseId) === String(selectedCourseId);
                            })
                            .map(b => (
                                <option key={b.id || b._id} value={b.id || b._id}>{b.name}</option>
                            ))}
                    </select>
                </div>

                <div className="flex-1 min-w-[200px] space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">Search Keywords</label>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search topic, batch..." 
                            className="input-field pl-12 bg-slate-50 border-transparent focus:bg-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {(user?.role === 'Admin' || user?.role === 'Staff') && (
                    <button 
                        onClick={handleOpenCreateModal}
                        className="btn-secondary h-[50px] px-6 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-secondary/20 min-w-[150px]"
                    >
                        <Plus size={18} />
                        <span className="font-black uppercase text-[10px] tracking-widest">Add Schedule</span>
                    </button>
                )}
            </div>

            {/* Main Calendar View */}
            <div className="w-full space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center">
                            <CalendarIcon size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 tracking-tighter uppercase leading-none">
                                {timeHorizon === 'week' ? 'Week Schedule' : timeHorizon === 'month' ? 'Month Schedule' : 'Upcoming Horizon'}
                            </h2>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                {timeHorizon !== 'upcoming' && formatMonthYear(selectedDate)}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex rounded-full bg-slate-100 p-1 border border-slate-200">
                            {['week', 'month', 'upcoming'].map((horizon) => (
                                <button
                                    key={horizon}
                                    onClick={() => setTimeHorizon(horizon)}
                                    className={cn(
                                        "px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-wider transition-all",
                                        timeHorizon === horizon 
                                            ? "bg-slate-900 text-white shadow-lg" 
                                            : "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    {horizon}
                                </button>
                            ))}
                        </div>
                        
                        {timeHorizon !== 'upcoming' && (
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => changeDate(-1)} 
                                    className="p-3 bg-slate-50 border border-slate-100 rounded-full hover:bg-slate-100 transition"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button 
                                    onClick={() => changeDate(1)} 
                                    className="p-3 bg-slate-50 border border-slate-100 rounded-full hover:bg-slate-100 transition"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="relative">
                    {loading ? (
                        <div className="text-center py-20 bg-slate-50 rounded-[3rem] animate-pulse">
                            <Activity className="w-12 h-12 text-slate-300 animate-spin mx-auto mb-4" />
                            <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Synchronizing Classroom Schedules...</p>
                        </div>
                    ) : (
                        <div className="animate-in fade-in duration-300">
                            {timeHorizon === 'week' ? renderWeekView() : timeHorizon === 'month' ? renderMonthView() : renderUpcomingView()}
                        </div>
                    )}
                </div>
            </div>

            {/* Create/Edit Schedule Modal */}
            <Modal
                isOpen={showFormModal}
                onClose={() => setShowFormModal(false)}
                title={editingSchedule ? "Modify Class Schedule" : "Add Class Schedule"}
                maxWidth="max-w-lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Assign Batch *</label>
                        <select 
                            className="input-field bg-white" 
                            value={formData.batchId} 
                            onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                            required
                        >
                            <option value="">Choose Batch...</option>
                            {batches.map(b => (
                                <option key={b.id} value={b.id}>{b.Course?.name} — {b.name}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Class Topic *</label>
                        <input 
                            type="text" 
                            className="input-field" 
                            value={formData.topic} 
                            onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                            placeholder="e.g. Intro to Medical Billing"
                            required 
                        />
                    </div>
                    
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Schedule Date *</label>
                        <input 
                            type="date" 
                            className="input-field bg-white" 
                            value={formData.date} 
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            required 
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Start Time *</label>
                            <input 
                                type="time" 
                                className="input-field bg-white" 
                                value={formData.startTime} 
                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                required 
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">End Time *</label>
                            <input 
                                type="time" 
                                className="input-field bg-white" 
                                value={formData.endTime} 
                                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                required 
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Session Status</label>
                        <select 
                            className="input-field bg-white" 
                            value={formData.status} 
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        >
                            <option value="Scheduled">Scheduled</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>

                    <div className="flex gap-4 pt-4">
                        {editingSchedule && (
                            <button
                                type="button"
                                onClick={() => handleDelete(editingSchedule.id)}
                                className="px-6 py-4 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-black uppercase text-[10px] tracking-widest transition"
                            >
                                Delete
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 btn-secondary py-4 font-black uppercase text-[10px] tracking-[0.2em]"
                        >
                            {isSubmitting ? 'Saving...' : editingSchedule ? 'Update Class' : 'Schedule Class'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Calendar;
