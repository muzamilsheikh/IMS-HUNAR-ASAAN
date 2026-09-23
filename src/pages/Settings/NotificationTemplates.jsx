import React, { useState, useEffect } from 'react';
import { 
    Bell, Mail, MessageSquare, Plus, Trash2, Edit3, Save, 
    X, Check, AlertCircle, Copy, Eye, Sparkles, RefreshCw,
    Shield, Send, Code, Tag, ChevronRight, HelpCircle
} from 'lucide-react';
import apiClient from '../../utils/api';
import toast from 'react-hot-toast';

const AVAILABLE_PLACEHOLDERS = [
    { key: 'student_name', label: 'Student Name', sample: 'Muhammad Ali' },
    { key: 'student_email', label: 'Student Email', sample: 'ali.student@gmail.com' },
    { key: 'phone', label: 'Phone', sample: '03001234567' },
    { key: 'course_name', label: 'Course Name', sample: 'Full Stack Web Development' },
    { key: 'batch_name', label: 'Batch Name', sample: 'Batch 2026-A' },
    { key: 'due_amount', label: 'Due Amount (Rs)', sample: '15,000' },
    { key: 'due_date', label: 'Due Date', sample: '28 Sep 2026' },
    { key: 'institute_name', label: 'Institute Name', sample: 'Hunar Asaan Skills Center' },
    { key: 'contact', label: 'Institute Contact', sample: '+92 300 0000000' },
    { key: 'student_id', label: 'Student ID', sample: 'HA-2026-089' },
];

const NotificationTemplates = () => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterCategory, setFilterCategory] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'preview'
    const [showHtmlEditor, setShowHtmlEditor] = useState(false);

    // Form state
    const [formState, setFormState] = useState({
        title: '',
        category: 'BOTH',
        subject: '',
        bodyText: '',
        bodyHtml: '',
        isActive: true,
        placeholders: []
    });

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const data = await apiClient.getNotificationTemplates();
            setTemplates(Array.isArray(data) ? data : []);
            if (!selectedTemplate && Array.isArray(data) && data.length > 0) {
                setSelectedTemplate(data[0]);
                populateForm(data[0]);
            }
        } catch (err) {
            console.error('Failed to load notification templates:', err);
            toast.error('Failed to load notification templates');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const populateForm = (tmpl) => {
        let parsedPlaceholders = [];
        try {
            parsedPlaceholders = typeof tmpl.placeholders === 'string' 
                ? JSON.parse(tmpl.placeholders || '[]') 
                : (tmpl.placeholders || []);
        } catch (e) {
            parsedPlaceholders = [];
        }

        setFormState({
            title: tmpl.title || '',
            category: tmpl.category || 'BOTH',
            subject: tmpl.subject || '',
            bodyText: tmpl.bodyText || '',
            bodyHtml: tmpl.bodyHtml || '',
            isActive: tmpl.isActive !== false,
            placeholders: parsedPlaceholders
        });
        setShowHtmlEditor(Boolean(tmpl.bodyHtml));
        setIsCreating(false);
    };

    const handleSelectTemplate = (tmpl) => {
        setSelectedTemplate(tmpl);
        populateForm(tmpl);
        setIsCreating(false);
        setActiveTab('editor');
    };

    const handleStartCreate = () => {
        setSelectedTemplate(null);
        setIsCreating(true);
        setFormState({
            title: '',
            category: 'BOTH',
            subject: '',
            bodyText: '',
            bodyHtml: '',
            isActive: true,
            placeholders: ['student_name', 'course_name', 'due_amount']
        });
        setShowHtmlEditor(false);
        setActiveTab('editor');
    };

    const insertPlaceholder = (key) => {
        const token = `{{${key}}}`;
        setFormState(prev => {
            const currentBody = prev.bodyText || '';
            const newBody = currentBody + (currentBody.endsWith(' ') || currentBody.length === 0 ? '' : ' ') + token;
            const updatedPlaceholders = prev.placeholders.includes(key) 
                ? prev.placeholders 
                : [...prev.placeholders, key];
            return {
                ...prev,
                bodyText: newBody,
                placeholders: updatedPlaceholders
            };
        });
        toast.success(`Inserted ${token}`);
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        if (!formState.title.trim()) {
            toast.error('Template Title is required');
            return;
        }
        if (!formState.bodyText.trim()) {
            toast.error('Message Body (Plain Text) is required');
            return;
        }
        if ((formState.category === 'EMAIL' || formState.category === 'BOTH') && !formState.subject.trim()) {
            toast.error('Email Subject is required for Email/Both templates');
            return;
        }

        try {
            setSaving(true);
            const payload = {
                title: formState.title.trim(),
                category: formState.category,
                subject: formState.subject.trim() || null,
                bodyText: formState.bodyText,
                bodyHtml: formState.bodyHtml.trim() || null,
                isActive: formState.isActive,
                placeholders: formState.placeholders
            };

            if (isCreating) {
                const created = await apiClient.createNotificationTemplate(payload);
                toast.success('Notification template created successfully! 🎉');
                await fetchTemplates();
                setSelectedTemplate(created);
                setIsCreating(false);
            } else if (selectedTemplate) {
                const updated = await apiClient.updateNotificationTemplate(selectedTemplate.id, payload);
                toast.success('Notification template updated successfully! ✅');
                await fetchTemplates();
                setSelectedTemplate(updated);
            }
        } catch (err) {
            console.error('Save template error:', err);
            toast.error(err.response?.data?.error || 'Failed to save template');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedTemplate) return;
        if (selectedTemplate.isSystem) {
            toast.error('System templates cannot be deleted as they are required by core workflows.');
            return;
        }

        if (!window.confirm(`Are you sure you want to delete template "${selectedTemplate.title}"?`)) {
            return;
        }

        try {
            setSaving(true);
            await apiClient.deleteNotificationTemplate(selectedTemplate.id);
            toast.success('Template deleted successfully');
            setSelectedTemplate(null);
            await fetchTemplates();
        } catch (err) {
            console.error('Delete template error:', err);
            toast.error(err.response?.data?.error || 'Failed to delete template');
        } finally {
            setSaving(false);
        }
    };

    // Interpolate sample data for live preview
    const renderPreview = (text) => {
        if (!text) return '';
        let res = text;
        AVAILABLE_PLACEHOLDERS.forEach(p => {
            const re = new RegExp(`\\{\\{${p.key}\\}\\}`, 'g');
            res = res.replace(re, p.sample);
        });
        return res;
    };

    const filteredTemplates = templates.filter(tmpl => {
        const matchesCategory = filterCategory === 'ALL' || tmpl.category === filterCategory;
        const matchesSearch = tmpl.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              tmpl.slug.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const getCategoryBadge = (category) => {
        switch (category) {
            case 'EMAIL':
                return <span className="bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1"><Mail size={11} /> Email</span>;
            case 'WHATSAPP':
                return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1"><MessageSquare size={11} /> WhatsApp</span>;
            case 'BOTH':
            default:
                return <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1"><Sparkles size={11} /> Email & WA</span>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header info */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-3xl shadow-xl">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Bell size={18} className="text-secondary" />
                        <span className="text-[10px] font-black text-secondary uppercase tracking-[0.3em]">Communication Engine</span>
                    </div>
                    <h3 className="text-2xl font-black tracking-tight">Notification Templates</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-xl">
                        Create reusable message templates for Email (SMTP) and WhatsApp. Use dynamic <code className="text-secondary font-mono">{"{{placeholders}}"}</code> that interpolate automatically with real student data.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handleStartCreate}
                        className="btn-secondary py-3 px-6 font-black text-xs uppercase tracking-widest shadow-lg flex items-center gap-2 active:scale-95 transition-all"
                    >
                        <Plus size={16} /> New Template
                    </button>
                    <button
                        type="button"
                        onClick={fetchTemplates}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-3 rounded-2xl transition-all"
                        title="Reload templates"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Sidebar: Templates List (4 cols) */}
                <div className="lg:col-span-4 space-y-4">
                    {/* Filters & Search */}
                    <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-md space-y-3">
                        <input
                            type="text"
                            placeholder="Search templates..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2.5 text-xs font-semibold rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-secondary transition-all"
                        />
                        <div className="flex gap-1.5 overflow-x-auto pb-1">
                            {['ALL', 'EMAIL', 'WHATSAPP', 'BOTH'].map(cat => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setFilterCategory(cat)}
                                    className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
                                        filterCategory === cat
                                            ? 'bg-slate-900 text-white shadow-sm'
                                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Template Cards */}
                    <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
                        {loading && templates.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 font-black text-xs uppercase tracking-widest animate-pulse">
                                Loading templates...
                            </div>
                        ) : filteredTemplates.length === 0 ? (
                            <div className="p-8 text-center bg-white rounded-3xl border border-slate-100 shadow-sm text-slate-400 text-xs font-semibold">
                                No templates found matching criteria.
                            </div>
                        ) : (
                            filteredTemplates.map(tmpl => {
                                const isSelected = !isCreating && selectedTemplate?.id === tmpl.id;
                                return (
                                    <div
                                        key={tmpl.id}
                                        onClick={() => handleSelectTemplate(tmpl)}
                                        className={`p-5 rounded-3xl border cursor-pointer transition-all duration-200 ${
                                            isSelected
                                                ? 'bg-slate-900 text-white border-slate-900 shadow-xl translate-x-1'
                                                : 'bg-white text-slate-800 border-slate-100 hover:border-slate-300 shadow-sm hover:shadow-md'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            {getCategoryBadge(tmpl.category)}
                                            <div className="flex items-center gap-1.5">
                                                {tmpl.isSystem && (
                                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                                        isSelected ? 'bg-secondary/20 text-secondary border border-secondary/40' : 'bg-slate-100 text-slate-500'
                                                    }`}>
                                                        System
                                                    </span>
                                                )}
                                                <span className={`w-2 h-2 rounded-full ${tmpl.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                            </div>
                                        </div>

                                        <h4 className="font-black text-sm tracking-tight mb-1 truncate">
                                            {tmpl.title}
                                        </h4>
                                        <p className={`text-[10px] font-mono truncate mb-2 ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>
                                            /{tmpl.slug}
                                        </p>

                                        <p className={`text-xs line-clamp-2 leading-relaxed ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                                            {tmpl.bodyText}
                                        </p>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Right Area: Template Editor & Preview (8 cols) */}
                <div className="lg:col-span-8 bg-white p-8 rounded-3xl border border-slate-100 shadow-xl space-y-6">
                    {/* Panel Top bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary font-black">
                                {isCreating ? <Plus size={20} /> : <Edit3 size={20} />}
                            </div>
                            <div>
                                <h4 className="text-lg font-black text-slate-800 tracking-tight">
                                    {isCreating ? 'Create New Notification Template' : `Edit: ${formState.title || 'Untitled'}`}
                                </h4>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    {selectedTemplate?.isSystem ? 'System Core Template (Content editable)' : 'Custom Template'}
                                </p>
                            </div>
                        </div>

                        {/* Editor vs Live Preview Switcher */}
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setActiveTab('editor')}
                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                                    activeTab === 'editor'
                                        ? 'bg-slate-900 text-white shadow-md'
                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}
                            >
                                <Code size={14} /> Editor
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('preview')}
                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                                    activeTab === 'preview'
                                        ? 'bg-slate-900 text-white shadow-md'
                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}
                            >
                                <Eye size={14} /> Live Preview
                            </button>
                        </div>
                    </div>

                    {activeTab === 'editor' ? (
                        <div className="space-y-6">
                            {/* Title & Category Row */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Template Title <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Fee Due Urgent Notice"
                                        value={formState.title}
                                        onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-800 text-sm focus:outline-none focus:border-secondary transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Channel Category
                                    </label>
                                    <select
                                        value={formState.category}
                                        onChange={(e) => setFormState({ ...formState, category: e.target.value })}
                                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 font-black text-xs uppercase tracking-wider text-slate-800 focus:outline-none focus:border-secondary transition-all"
                                    >
                                        <option value="BOTH">Both (Email & WhatsApp)</option>
                                        <option value="EMAIL">Email Only</option>
                                        <option value="WHATSAPP">WhatsApp Only</option>
                                    </select>
                                </div>
                            </div>

                            {/* Email Subject (if EMAIL or BOTH) */}
                            {(formState.category === 'EMAIL' || formState.category === 'BOTH') && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Email Subject Line <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Important Notice: Fee Installment Due — {{institute_name}}"
                                        value={formState.subject}
                                        onChange={(e) => setFormState({ ...formState, subject: e.target.value })}
                                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-800 text-sm focus:outline-none focus:border-secondary transition-all"
                                    />
                                </div>
                            )}

                            {/* Dynamic Variable Chips */}
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                        <Tag size={13} className="text-secondary" /> Click Token to Insert Variable:
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-medium">Replaced dynamically on send</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {AVAILABLE_PLACEHOLDERS.map((p) => (
                                        <button
                                            key={p.key}
                                            type="button"
                                            onClick={() => insertPlaceholder(p.key)}
                                            className="px-2.5 py-1 bg-white hover:bg-secondary hover:text-white text-slate-700 border border-slate-200 rounded-xl text-[11px] font-mono font-semibold transition-all shadow-sm active:scale-95"
                                            title={`Sample value: ${p.sample}`}
                                        >
                                            + {`{{${p.key}}}`}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Message Body (Plain Text / WhatsApp) */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Message Body (Plain Text / WhatsApp) <span className="text-rose-500">*</span>
                                    </label>
                                    <span className="text-[10px] text-slate-400 font-medium">Supports WhatsApp formatting (*bold*, _italic_)</span>
                                </div>
                                <textarea
                                    rows={8}
                                    value={formState.bodyText}
                                    onChange={(e) => setFormState({ ...formState, bodyText: e.target.value })}
                                    placeholder="Write your reminder message here... Insert variables using tokens above."
                                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 font-medium text-slate-800 text-sm focus:outline-none focus:border-secondary transition-all leading-relaxed"
                                />
                            </div>

                            {/* Optional HTML Body Toggle */}
                            {(formState.category === 'EMAIL' || formState.category === 'BOTH') && (
                                <div className="space-y-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowHtmlEditor(!showHtmlEditor)}
                                        className="text-xs font-black text-secondary hover:underline flex items-center gap-1.5"
                                    >
                                        <Code size={14} />
                                        {showHtmlEditor ? 'Hide Advanced HTML Body' : 'Add Advanced HTML Body (Optional)'}
                                    </button>

                                    {showHtmlEditor && (
                                        <div className="space-y-2 animate-in fade-in duration-300">
                                            <p className="text-[10px] text-slate-400 font-semibold">
                                                Provide custom HTML layout for email clients. If left blank, the plain text message body will be styled cleanly in standard email format.
                                            </p>
                                            <textarea
                                                rows={6}
                                                value={formState.bodyHtml}
                                                onChange={(e) => setFormState({ ...formState, bodyHtml: e.target.value })}
                                                placeholder="<div><h2>{{institute_name}}</h2><p>Dear {{student_name}},</p>...</div>"
                                                className="w-full p-4 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-xs border border-slate-800 focus:outline-none focus:border-secondary transition-all"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Active Toggle & Action Buttons */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formState.isActive}
                                        onChange={(e) => setFormState({ ...formState, isActive: e.target.checked })}
                                        className="w-5 h-5 rounded-lg text-secondary focus:ring-secondary accent-secondary"
                                    />
                                    <span className="text-xs font-bold text-slate-700">Template Active (Available in Student Ledger)</span>
                                </label>

                                <div className="flex items-center gap-3">
                                    {!isCreating && selectedTemplate && !selectedTemplate.isSystem && (
                                        <button
                                            type="button"
                                            onClick={handleDelete}
                                            disabled={saving}
                                            className="px-4 py-3 text-rose-600 hover:bg-rose-50 rounded-2xl font-black text-xs uppercase tracking-wider border border-rose-200 transition-all flex items-center gap-1.5"
                                        >
                                            <Trash2 size={15} /> Delete
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="btn-secondary py-3.5 px-8 font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 active:scale-95 transition-all"
                                    >
                                        <Save size={16} /> {saving ? 'Saving...' : isCreating ? 'Create Template' : 'Save Changes'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Live Preview Mode */
                        <div className="space-y-6">
                            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2">
                                <HelpCircle size={16} className="text-amber-600 flex-shrink-0" />
                                <span>Preview shows simulated rendering using sample student data (Muhammad Ali, Course: Full Stack Web, Due: Rs. 15,000).</span>
                            </div>

                            {/* WhatsApp Preview Card */}
                            {(formState.category === 'WHATSAPP' || formState.category === 'BOTH') && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-700">
                                        <MessageSquare size={14} /> WhatsApp Message Preview
                                    </div>
                                    <div className="p-6 rounded-3xl bg-[#e5ddd5] dark:bg-slate-900 border border-slate-200">
                                        <div className="max-w-md bg-white p-4 rounded-2xl rounded-tl-sm shadow-md space-y-2 border border-slate-100">
                                            <div className="text-[11px] font-black text-emerald-600 uppercase tracking-wider">
                                                Hunar Asaan CRM
                                            </div>
                                            <p className="text-xs text-slate-800 font-medium whitespace-pre-line leading-relaxed">
                                                {renderPreview(formState.bodyText)}
                                            </p>
                                            <div className="text-[9px] text-slate-400 text-right">
                                                12:30 PM ✓✓
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Email Preview Card */}
                            {(formState.category === 'EMAIL' || formState.category === 'BOTH') && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-sky-700">
                                        <Mail size={14} /> Email Message Preview
                                    </div>
                                    <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-4">
                                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                            <div className="border-b border-slate-100 pb-3">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject</p>
                                                <p className="text-sm font-black text-slate-800">
                                                    {renderPreview(formState.subject || 'No subject set')}
                                                </p>
                                            </div>
                                            <div className="whitespace-pre-line text-xs text-slate-700 leading-relaxed font-sans">
                                                {renderPreview(formState.bodyText)}
                                            </div>
                                            <div className="pt-4 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
                                                <span>Sent via Hunar Asaan Automated SMTP</span>
                                                <span>Do not reply to this email</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationTemplates;
