import React, { useState, useEffect, useMemo } from 'react';
import { 
    X, MessageSquare, Mail, Send, ExternalLink, Sparkles, 
    AlertCircle, CheckCircle, User, Phone, DollarSign, Calendar,
    RefreshCw, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../../utils/api';
import toast from 'react-hot-toast';

const SendReminderModal = ({ 
    isOpen, 
    onClose, 
    student, 
    enrollments = [], 
    balance = 0, 
    settings = {} 
}) => {
    const [channel, setChannel] = useState('WHATSAPP'); // 'WHATSAPP' | 'EMAIL'
    const [templates, setTemplates] = useState([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [customizedText, setCustomizedText] = useState('');
    const [customizedSubject, setCustomizedSubject] = useState('');
    const [sending, setSending] = useState(false);

    // Fetch active templates on open
    useEffect(() => {
        if (!isOpen) return;

        const loadTemplates = async () => {
            try {
                setLoadingTemplates(true);
                const data = await apiClient.getNotificationTemplates();
                const activeList = Array.isArray(data) 
                    ? data.filter(t => t.isActive !== false) 
                    : [];
                setTemplates(activeList);
            } catch (err) {
                console.error('Failed to load templates in SendReminderModal:', err);
                toast.error('Failed to load message templates');
            } finally {
                setLoadingTemplates(false);
            }
        };

        loadTemplates();
    }, [isOpen]);

    // Compatible templates based on selected channel
    const compatibleTemplates = useMemo(() => {
        return templates.filter(t => {
            if (channel === 'WHATSAPP') return t.category === 'WHATSAPP' || t.category === 'BOTH';
            if (channel === 'EMAIL') return t.category === 'EMAIL' || t.category === 'BOTH';
            return true;
        });
    }, [templates, channel]);

    // Auto-select first compatible template when channel or list changes
    useEffect(() => {
        if (compatibleTemplates.length > 0) {
            const currentStillValid = compatibleTemplates.some(t => t.id === selectedTemplateId);
            if (!currentStillValid) {
                setSelectedTemplateId(compatibleTemplates[0].id);
            }
        } else {
            setSelectedTemplateId('');
        }
    }, [compatibleTemplates, selectedTemplateId]);

    // Compute dynamic replacement dictionary from real student data
    const vars = useMemo(() => {
        if (!student) return {};
        const primaryEnrollment = enrollments?.[0] || null;
        const phone = student.phone || '';
        const intlPhone = phone.startsWith('+')
            ? phone.replace(/\D/g, '')
            : phone.replace(/^0/, '92').replace(/\D/g, '');

        const courseName = primaryEnrollment?.Course?.name || student.Course?.name || 'N/A';
        const batchName = primaryEnrollment?.Batch?.name || student.Batch?.name || 'N/A';
        const dueAmount = balance !== undefined ? Number(balance).toLocaleString() : (student.totalFee || '0');
        const dueDate = student.next_due_date
            ? new Date(student.next_due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
            : 'N/A';

        return {
            student_name: student.name || '',
            student_email: student.email || '',
            phone,
            intl_phone: intlPhone,
            course_name: courseName,
            batch_name: batchName,
            due_amount: dueAmount,
            due_date: dueDate,
            institute_name: settings?.instituteName || 'Hunar Asaan Skills Center',
            contact: settings?.contact || '',
            student_id: student.customId || String(student.id || '')
        };
    }, [student, enrollments, balance, settings]);

    // Interpolation helper
    const interpolateText = (rawText = '') => {
        return rawText.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] !== undefined ? vars[key] : `{{${key}}}`);
    };

    // Update customized preview when selected template changes
    useEffect(() => {
        const tmpl = templates.find(t => t.id === selectedTemplateId);
        if (tmpl) {
            setCustomizedText(interpolateText(tmpl.bodyText || ''));
            setCustomizedSubject(interpolateText(tmpl.subject || ''));
        } else {
            setCustomizedText('');
            setCustomizedSubject('');
        }
    }, [selectedTemplateId, templates, vars]);

    if (!isOpen) return null;

    const handleSend = async () => {
        if (!selectedTemplateId) {
            toast.error('Please select a template first');
            return;
        }

        if (channel === 'WHATSAPP') {
            const rawPhone = student?.phone;
            if (!rawPhone || !rawPhone.trim()) {
                toast.error('Student does not have a phone number registered!');
                return;
            }

            const intlPhone = vars.intl_phone;
            if (!intlPhone) {
                toast.error('Invalid phone number format');
                return;
            }

            const encodedMsg = encodeURIComponent(customizedText);
            const waUrl = `https://wa.me/${intlPhone}?text=${encodedMsg}`;
            
            window.open(waUrl, '_blank', 'noopener,noreferrer');
            toast.success(`WhatsApp chat opened for ${student.name}! 💬`);
            onClose();
        } else if (channel === 'EMAIL') {
            if (!student?.email || !student.email.trim()) {
                toast.error('Student does not have an email address registered!');
                return;
            }

            try {
                setSending(true);
                await apiClient.sendNotificationReminder({
                    templateId: selectedTemplateId,
                    studentId: student.id,
                    channel: 'EMAIL'
                });
                toast.success(`Reminder email dispatched to ${student.email}! ✉️`);
                onClose();
            } catch (err) {
                console.error('Email dispatch error:', err);
                toast.error(err.response?.data?.error || 'Failed to dispatch email reminder');
            } finally {
                setSending(false);
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }} 
                animate={{ scale: 1, opacity: 1, y: 0 }} 
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-100"
            >
                {/* Header */}
                <div className="bg-slate-950 text-white p-6 sm:p-8 flex items-center justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-secondary/20 rounded-full blur-3xl pointer-events-none" />
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Sparkles size={16} className="text-secondary" />
                            <span className="text-[10px] font-black text-secondary uppercase tracking-[0.3em]">Multi-Channel Dispatch</span>
                        </div>
                        <h3 className="text-2xl font-black tracking-tight">Send Student Reminder</h3>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
                    {/* Student Snapshot Card */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary font-black text-sm">
                                {student?.name?.charAt(0) || 'S'}
                            </div>
                            <div>
                                <h4 className="font-black text-slate-800 text-sm tracking-tight">{student?.name}</h4>
                                <p className="text-[10px] text-slate-500 font-medium">
                                    ID: <span className="font-mono font-bold text-slate-700">{vars.student_id}</span>
                                    {vars.phone && <> • Phone: <span className="font-semibold text-slate-700">{vars.phone}</span></>}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Remaining Balance</p>
                            <p className="text-base font-black text-rose-600">Rs. {vars.due_amount}</p>
                        </div>
                    </div>

                    {/* Channel Selector */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Dispatch Channel
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setChannel('WHATSAPP')}
                                className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-center gap-3 font-black text-xs uppercase tracking-wider ${
                                    channel === 'WHATSAPP'
                                        ? 'border-emerald-500 bg-emerald-50/80 text-emerald-700 shadow-md shadow-emerald-500/10'
                                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                                }`}
                            >
                                <MessageSquare size={18} className={channel === 'WHATSAPP' ? 'text-emerald-600' : 'text-slate-400'} />
                                WhatsApp Direct
                            </button>
                            <button
                                type="button"
                                onClick={() => setChannel('EMAIL')}
                                className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-center gap-3 font-black text-xs uppercase tracking-wider ${
                                    channel === 'EMAIL'
                                        ? 'border-sky-500 bg-sky-50/80 text-sky-700 shadow-md shadow-sky-500/10'
                                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                                }`}
                            >
                                <Mail size={18} className={channel === 'EMAIL' ? 'text-sky-600' : 'text-slate-400'} />
                                Email (SMTP)
                            </button>
                        </div>
                    </div>

                    {/* Template Selector */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Choose Notification Template
                            </label>
                            {loadingTemplates && (
                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                    <RefreshCw size={10} className="animate-spin" /> Loading...
                                </span>
                            )}
                        </div>

                        {compatibleTemplates.length === 0 && !loadingTemplates ? (
                            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-800 text-xs font-semibold">
                                No active templates available for {channel}. You can create one in Settings → Notification Templates.
                            </div>
                        ) : (
                            <div className="relative">
                                <select
                                    value={selectedTemplateId}
                                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-800 text-sm focus:outline-none focus:border-secondary transition-all appearance-none cursor-pointer"
                                >
                                    {compatibleTemplates.map(t => (
                                        <option key={t.id} value={t.id}>
                                            {t.title} ({t.category})
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        )}
                    </div>

                    {/* Email Subject Line (when Email channel is active) */}
                    {channel === 'EMAIL' && (
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Email Subject Line
                            </label>
                            <input
                                type="text"
                                value={customizedSubject}
                                onChange={(e) => setCustomizedSubject(e.target.value)}
                                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-800 text-sm focus:outline-none focus:border-secondary transition-all"
                            />
                        </div>
                    )}

                    {/* Live Interpolated Message Preview / Quick Edit */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Live Message Preview (Variables Replaced)
                            </label>
                            <span className="text-[10px] text-slate-400 font-medium">You can fine-tune text before dispatching</span>
                        </div>

                        {channel === 'WHATSAPP' ? (
                            <div className="p-4 rounded-3xl bg-[#e5ddd5] dark:bg-slate-900 border border-slate-200">
                                <div className="bg-white p-4 rounded-2xl rounded-tl-sm shadow-md space-y-2 border border-slate-100">
                                    <div className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">
                                        WhatsApp Message Preview
                                    </div>
                                    <textarea
                                        rows={6}
                                        value={customizedText}
                                        onChange={(e) => setCustomizedText(e.target.value)}
                                        className="w-full text-xs text-slate-800 font-medium leading-relaxed bg-transparent border-0 focus:ring-0 p-0 resize-none focus:outline-none"
                                    />
                                    <div className="text-[9px] text-slate-400 text-right">
                                        Ready to Send ✓✓
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
                                <div className="text-[10px] font-black text-sky-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Mail size={13} /> Recipient: <span className="font-mono text-slate-700">{student?.email || 'No email registered'}</span>
                                </div>
                                <textarea
                                    rows={6}
                                    value={customizedText}
                                    onChange={(e) => setCustomizedText(e.target.value)}
                                    className="w-full p-3 text-xs text-slate-700 leading-relaxed bg-white rounded-2xl border border-slate-200 focus:outline-none focus:border-sky-500 font-sans"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="bg-slate-50 p-6 border-t border-slate-100 flex items-center justify-between gap-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3.5 rounded-2xl text-slate-500 hover:text-slate-800 font-black text-xs uppercase tracking-wider hover:bg-slate-100 transition-all"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={handleSend}
                        disabled={sending || !selectedTemplateId}
                        className={`py-3.5 px-8 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-xl active:scale-95 transition-all flex items-center gap-2.5 ${
                            channel === 'WHATSAPP'
                                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                                : 'bg-sky-600 hover:bg-sky-700 shadow-sky-600/30'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {sending ? (
                            <>
                                <RefreshCw size={16} className="animate-spin" /> Dispatching...
                            </>
                        ) : channel === 'WHATSAPP' ? (
                            <>
                                <MessageSquare size={16} /> Open WhatsApp Chat <ExternalLink size={14} />
                            </>
                        ) : (
                            <>
                                <Send size={16} /> Dispatch SMTP Email
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default SendReminderModal;
