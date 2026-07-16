import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
    Users, Layers, Clock, Plus, Search, Trash2, Edit3, Filter, ArrowRight, X, GraduationCap, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../components/layout/Modal';

const Batches = () => {
    const { batches, courses, students, addBatch, deleteBatch, updateBatch, user } = useApp();
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingBatch, setEditingBatch] = useState(null);
    const [newBatch, setNewBatch] = useState({
        name: '',
        time: '',
        courseId: '',
        startDate: '',
        scheduleDays: [],
        startTime: '',
        endTime: ''
    });

    const filteredBatches = batches.filter(b =>
        b.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const handleDayToggle = (day) => {
        setNewBatch(prev => {
            const days = prev.scheduleDays.includes(day)
                ? prev.scheduleDays.filter(d => d !== day)
                : [...prev.scheduleDays, day];
            return { ...prev, scheduleDays: days };
        });
    };

    const handleTimeFieldChange = (field, val) => {
        setNewBatch(prev => {
            const updated = { ...prev, [field]: val };
            const s = field === 'startTime' ? val : prev.startTime;
            const e = field === 'endTime' ? val : prev.endTime;
            if (s && e) {
                updated.time = `${s} - ${e}`;
            }
            return updated;
        });
    };

    const handleEditClick = (batch) => {
        setEditingBatch(batch);
        let daysArray = [];
        if (batch.scheduleDays) {
            daysArray = batch.scheduleDays.split(',').map(d => d.trim());
        }
        setNewBatch({
            name: batch.name || '',
            time: batch.time || '',
            courseId: batch.courseId?.id || batch.courseId?._id || batch.courseId || '',
            startDate: batch.startDate || '',
            scheduleDays: daysArray,
            startTime: batch.startTime || '',
            endTime: batch.endTime || ''
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newBatch.courseId) return alert('Select a course');
        // Convert courseId to integer (Sequelize expects integer, not string)
        const batchData = {
            ...newBatch,
            courseId: parseInt(newBatch.courseId) || null
        };
        
        if (editingBatch) {
            await updateBatch(editingBatch.id || editingBatch._id, batchData);
        } else {
            await addBatch(batchData);
        }
        setShowModal(false);
        setEditingBatch(null);
        setNewBatch({
            name: '',
            time: '',
            courseId: '',
            startDate: '',
            scheduleDays: [],
            startTime: '',
            endTime: ''
        });
    };

    const handleSeeStudents = (batchId) => {
        navigate('/students', { state: { batchId } });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Batch Management</h2>
                    <p className="text-slate-400 mt-1 font-medium">Coordinate timing groups, schedule classes, and monitor enrollment.</p>
                </div>
                {user?.role !== 'accounts_manager' && (
                    <button 
                        onClick={() => {
                            setEditingBatch(null);
                            setNewBatch({
                                name: '',
                                time: '',
                                courseId: '',
                                startDate: '',
                                scheduleDays: [],
                                startTime: '',
                                endTime: ''
                            });
                            setShowModal(true);
                        }} 
                        className="btn-secondary flex items-center gap-2"
                    >
                        <Plus size={20} /> Create New Batch
                    </button>
                )}
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search batches..."
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-2xl focus:bg-white border-transparent outline-none transition-all font-medium"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredBatches.map((batch) => {
                    const batchCourseId = batch.courseId?.id || batch.courseId?._id || batch.courseId;
                    const course = courses.find(c => (c.id === batchCourseId || c._id === batchCourseId));
                    const batchId = batch.id || batch._id;
                    const batchStudents = students.filter(s => {
                        const sBatchId = s.batchId?.id || s.batchId?._id || s.batchId;
                        return sBatchId === batchId;
                    });

                    return (
                        <motion.div key={batch.id || batch._id} whileHover={{ y: -5 }} className="glass-card group border-l-8 border-l-secondary bg-white shadow-lg overflow-hidden">
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-14 h-14 bg-secondary/5 text-secondary rounded-2xl flex items-center justify-center border border-secondary/10">
                                        <Layers size={28} />
                                    </div>
                                    {user?.role !== 'accounts_manager' && (
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleEditClick(batch)} 
                                                className="p-2 text-slate-400 hover:text-secondary hover:bg-slate-100 rounded-lg transition-all"
                                                title="Edit Batch"
                                            >
                                                <Edit3 size={18} />
                                            </button>
                                            <button 
                                                onClick={() => deleteBatch(batch.id || batch._id)} 
                                                className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                title="Delete Batch"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="mb-6">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">{course?.name || 'Assigned Course'}</p>
                                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">{batch.name}</h3>
                                </div>

                                <div className="flex flex-col gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-8 text-slate-600 font-bold">
                                    <div className="flex items-center gap-3">
                                        <Clock size={16} className="text-secondary" />
                                        <span className="text-sm">{batch.time || 'No timing set'}</span>
                                    </div>
                                    {batch.scheduleDays && (
                                        <div className="text-xs text-slate-400 mt-1 pl-7 flex flex-wrap gap-1 items-center">
                                            <span>Days:</span>
                                            {batch.scheduleDays.split(',').map((day, idx) => (
                                                <span key={idx} className="px-1.5 py-0.5 bg-slate-200/60 rounded text-slate-600 font-extrabold text-[10px]">
                                                    {day.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {batch.startDate && (
                                        <div className="text-xs text-slate-400 mt-1 pl-7 flex items-center gap-1">
                                            <Calendar size={12} className="text-slate-400" />
                                            <span>Starts: <span className="text-slate-600 font-bold">{batch.startDate}</span></span>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
                                    <button
                                        onClick={() => handleSeeStudents(batch.id || batch._id)}
                                        className="flex items-center gap-2 text-sm font-black text-secondary hover:text-secondary-dark group"
                                    >
                                        See Students <span className="px-2 py-0.5 bg-secondary/10 rounded-full text-[10px]">{batchStudents.length}</span>
                                    </button>
                                    <div className="flex -space-x-2">
                                        {batchStudents.slice(0, 3).map((s, i) => (
                                            <div key={i} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-500 shadow-sm" title={s.name}>
                                                {s.name.charAt(0)}
                                            </div>
                                        ))}
                                        {batchStudents.length > 3 && (
                                            <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-400">
                                                +{batchStudents.length - 3}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <AnimatePresence>
                {showModal && (
                    <Modal
                        isOpen={showModal}
                        onClose={() => {
                            setShowModal(false);
                            setEditingBatch(null);
                        }}
                        title={editingBatch ? "Edit Timing & Schedule Configuration" : "Create Timing & Schedule Configuration"}
                        maxWidth="max-w-lg"
                    >
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Batch Identifier</label>
                                <input required className="input-field" placeholder="e.g. Morning A" value={newBatch.name} onChange={e => setNewBatch({ ...newBatch, name: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Associated Course</label>
                                <select required className="input-field bg-white" value={newBatch.courseId} onChange={e => setNewBatch({ ...newBatch, courseId: e.target.value })}>
                                    <option value="">Select Catalog Course</option>
                                    {courses.map(c => <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>)}
                                </select>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Start Date</label>
                                    <input type="date" required className="input-field" value={newBatch.startDate} onChange={e => setNewBatch({ ...newBatch, startDate: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Training Hours (Manual Override)</label>
                                    <input className="input-field" placeholder="e.g. 09:00 - 11:00 AM" value={newBatch.time} onChange={e => setNewBatch({ ...newBatch, time: e.target.value })} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Class Start Time</label>
                                    <input type="time" required className="input-field" value={newBatch.startTime} onChange={e => handleTimeFieldChange('startTime', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Class End Time</label>
                                    <input type="time" required className="input-field" value={newBatch.endTime} onChange={e => handleTimeFieldChange('endTime', e.target.value)} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Recurrent Schedule Days</label>
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {weekdays.map(day => {
                                        const isSelected = newBatch.scheduleDays.includes(day);
                                        return (
                                            <button
                                                key={day}
                                                type="button"
                                                onClick={() => handleDayToggle(day)}
                                                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                                                    isSelected 
                                                    ? 'bg-secondary text-white border-secondary shadow-md shadow-secondary/20' 
                                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                                                }`}
                                            >
                                                {day}
                                            </button>
                                        );
                                    })}
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium ml-1">Schedules are auto-populated inside the calendar matrix for the lifetime of the course on these days.</p>
                            </div>

                            <button type="submit" className="btn-secondary w-full py-4 text-base font-black tracking-tight mt-4 uppercase shadow-xl shadow-secondary/20">
                                {editingBatch ? "Update Batch & Regenerate Schedules" : "Publish Batch & Generate Schedules"}
                            </button>
                        </form>
                    </Modal>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Batches;
