import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
    BookOpen, Plus, Search, Edit3, Trash2, Users, Clock, Tag, X, Sparkles, CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../components/layout/Modal';

const Courses = () => {
    const { courses, addCourse, updateCourse } = useApp();
    const [showModal, setShowModal] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const [formData, setFormData] = useState({ 
        name: '', 
        fee: '', 
        durationValue: '', 
        durationUnit: 'Months', 
        code: '',
        classesPerWeek: '',
        offerInstallments: false,
        allowed_installments: ''
    });

    const handleOpenModal = (course = null) => {
        if (course) {
            setEditingCourse(course);
            setFormData({ 
                name: course.name || '', 
                fee: course.fee || '', 
                durationValue: course.durationValue || '', 
                durationUnit: course.durationUnit || 'Months', 
                code: course.code || '',
                classesPerWeek: course.classesPerWeek || '',
                offerInstallments: course.offerInstallments || false,
                allowed_installments: course.allowed_installments || ''
            });
        } else {
            setEditingCourse(null);
            setFormData({ 
                name: '', 
                fee: '', 
                durationValue: '', 
                durationUnit: 'Months', 
                code: '',
                classesPerWeek: '2',
                offerInstallments: false,
                allowed_installments: ''
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const durationString = `${formData.durationValue} ${formData.durationUnit}`;
        const data = { 
            name: formData.name, 
            fee: parseFloat(formData.fee), 
            duration: durationString,
            code: formData.code.toUpperCase(),
            durationValue: parseInt(formData.durationValue),
            durationUnit: formData.durationUnit,
            classesPerWeek: parseInt(formData.classesPerWeek),
            offerInstallments: formData.offerInstallments,
            allowed_installments: formData.offerInstallments ? parseInt(formData.allowed_installments) : null,
            totalClasses: parseInt(formData.durationValue) * (formData.durationUnit === 'Months' ? 4 : 1) * parseInt(formData.classesPerWeek)
        };

        const targetId = editingCourse ? (editingCourse.id || editingCourse._id) : null;
        if (editingCourse) {
            await updateCourse(targetId, data);
        } else {
            await addCourse(data);
        }
        setShowModal(false);
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Course Catalog</h2>
                    <p className="text-slate-400 mt-1 font-medium">Manage academic offerings and pricing strategies.</p>
                </div>
                <button onClick={() => handleOpenModal()} className="btn-secondary flex items-center gap-2">
                    <Plus size={20} /> Create New Course
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {courses && courses.length > 0 ? (
                    courses.map((course) => (
                        <motion.div key={course.id || course._id} whileHover={{ y: -5 }} className="glass-card group bg-white border-t-8 border-t-secondary transition-all shadow-xl">
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-14 h-14 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center border border-secondary/10">
                                        <BookOpen size={28} />
                                    </div>
                                    <button onClick={() => handleOpenModal(course)} className="p-2 text-slate-300 hover:text-secondary hover:bg-secondary/5 rounded-lg">
                                        <Edit3 size={18} />
                                    </button>
                                </div>

                                <div className="mb-8">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded text-[10px] font-black">{course.code}</span>
                                        <Sparkles size={12} className="text-secondary" />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-tight uppercase">{course.name}</h3>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <Clock size={16} className="text-slate-400" />
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Duration</span>
                                        </div>
                                        <span className="font-extrabold text-slate-800 text-sm">{course.duration}</span>
                                    </div>
                                    {course.totalClasses && (
                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div className="flex items-center gap-2">
                                                <BookOpen size={16} className="text-slate-400" />
                                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Classes</span>
                                            </div>
                                            <span className="font-extrabold text-slate-800 text-sm">{course.totalClasses} Lectures ({course.classesPerWeek || 2}/wk)</span>
                                        </div>
                                    )}
                                    {course.offerInstallments && (
                                        <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                            <div className="flex items-center gap-2">
                                                <CreditCard size={16} className="text-emerald-600" />
                                                <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Installments</span>
                                            </div>
                                            <span className="font-extrabold text-emerald-700 text-sm">Allowed: {course.allowed_installments} Max</span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between p-4 bg-secondary/10 rounded-2xl border border-secondary/10">
                                        <div className="flex items-center gap-2">
                                            <Tag size={16} className="text-secondary" />
                                            <span className="text-xs font-black text-secondary uppercase tracking-widest">Standard Fee</span>
                                        </div>
                                        <span className="font-black text-secondary text-lg">Rs. {Number(course.fee || 0).toLocaleString()}</span>
                                    </div>
                                    {course.Instructors && course.Instructors.length > 0 && (
                                        <div className="space-y-2 pt-2">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Assigned Instructors</span>
                                            <div className="flex flex-wrap gap-1.5">
                                                {course.Instructors.map(instructor => (
                                                    <span key={instructor.id} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200" title={instructor.specialty || 'Instructor'}>
                                                        {instructor.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <Users size={16} className="text-slate-300" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Curriculum</span>
                                    </div>
                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Verified</span>
                                </div>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="col-span-full text-center py-20">
                        <BookOpen size={48} className="text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 font-bold text-lg">No courses available</p>
                        <p className="text-slate-400 mt-2">Create your first course to get started</p>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {showModal && (
                    <Modal
                        isOpen={showModal}
                        onClose={() => setShowModal(false)}
                        title={editingCourse ? 'Modify Course Architecture' : 'Launch New Course'}
                        maxWidth="max-w-lg"
                    >
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Serial Code</label>
                                    <input placeholder="MB" className="input-field" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })} required />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Duration Value</label>
                                    <input type="number" placeholder="3" className="input-field" value={formData.durationValue} onChange={e => setFormData({ ...formData, durationValue: e.target.value })} required />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Duration Unit</label>
                                    <select className="input-field bg-white" value={formData.durationUnit} onChange={e => setFormData({ ...formData, durationUnit: e.target.value })}>
                                        <option value="Months">Months</option>
                                        <option value="Weeks">Weeks</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Classes Per Week</label>
                                    <input type="number" placeholder="2" className="input-field" value={formData.classesPerWeek} onChange={e => setFormData({ ...formData, classesPerWeek: e.target.value })} required />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Course Name</label>
                                <input placeholder="Medical Billing..." className="input-field" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Tuition Fee (Rs.)</label>
                                <input type="number" placeholder="30000" className="input-field" value={formData.fee} onChange={e => setFormData({ ...formData, fee: e.target.value })} required />
                            </div>

                            {/* Offer Installment plans toggle */}
                            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <input 
                                    type="checkbox" 
                                    id="offerInstallments"
                                    checked={formData.offerInstallments} 
                                    onChange={(e) => setFormData({ ...formData, offerInstallments: e.target.checked })} 
                                    className="w-5 h-5 accent-secondary flex-shrink-0 cursor-pointer"
                                />
                                <label htmlFor="offerInstallments" className="text-xs font-black uppercase text-slate-500 tracking-widest cursor-pointer select-none">
                                    Offer Installment Plans?
                                </label>
                            </div>

                            {formData.offerInstallments && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="space-y-1"
                                >
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Max Installments Allowed</label>
                                    <input type="number" min="2" max="12" placeholder="3" className="input-field" value={formData.allowed_installments} onChange={e => setFormData({ ...formData, allowed_installments: e.target.value })} required />
                                </motion.div>
                            )}

                            <button type="submit" className="btn-secondary w-full py-4 font-black mt-4 uppercase tracking-wider">
                                {editingCourse ? 'Save Changes' : 'Create Course'}
                            </button>
                        </form>
                    </Modal>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Courses;
