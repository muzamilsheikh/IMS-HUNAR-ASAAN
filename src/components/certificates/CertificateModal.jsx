import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { 
    X, Download, Mail, Send, Award, CheckCircle, Edit3, Image as ImageIcon, 
    Sparkles, RefreshCw, Share2, FileText, Check, ShieldCheck, User, Calendar, BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import apiClient from '../../utils/api';
import { generateCertificatePDF, printCertificateWindow } from '../../utils/generateCertificatePDF';
import { logoBase64 } from '../../utils/logoBase64';

// Default Golden Badge SVGs / Image Data URLs
const GOLDEN_BADGE_PRESETS = [
    {
        id: 'gold_ribbon_classic',
        name: 'Golden Ribbon Seal',
        svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 5L62 14L77 11L82 26L96 32L93 47L100 60L89 71L90 86L75 87L67 100L50 93L33 100L25 87L10 86L11 71L0 60L7 47L4 32L18 26L23 11L38 14L50 5Z" fill="url(#gold_grad)"/>
            <circle cx="50" cy="50" r="35" fill="url(#gold_inner)" stroke="#fef08a" stroke-width="2"/>
            <circle cx="50" cy="50" r="30" stroke="#b45309" stroke-width="1.5" stroke-dasharray="3 3"/>
            <path d="M50 25L54 38L67 38L56 46L60 59L50 51L40 59L44 46L33 38L46 38L50 25Z" fill="#78350f"/>
            <defs>
                <linearGradient id="gold_grad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#fef08a"/>
                    <stop offset="0.3" stop-color="#f59e0b"/>
                    <stop offset="0.7" stop-color="#d97706"/>
                    <stop offset="1" stop-color="#78350f"/>
                </linearGradient>
                <linearGradient id="gold_inner" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#fffbeb"/>
                    <stop offset="0.5" stop-color="#fde047"/>
                    <stop offset="1" stop-color="#d97706"/>
                </linearGradient>
            </defs>
        </svg>`
    },
    {
        id: 'gold_star_burst',
        name: 'Excellence Star Badge',
        svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="45" fill="url(#grad_star)"/>
            <polygon points="50,15 61,35 83,38 67,54 71,76 50,65 29,76 33,54 17,38 39,35" fill="#fef08a" stroke="#b45309" stroke-width="1"/>
            <defs>
                <linearGradient id="grad_star" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#fbbf24"/>
                    <stop offset="1" stop-color="#b45309"/>
                </linearGradient>
            </defs>
        </svg>`
    }
];

// Sample Default Collaboration Logo (DEEP10X text logo SVG)
const DEFAULT_DEEP10X_LOGO = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 60" fill="none"><rect width="250" height="60" rx="10" fill="white"/><circle cx="35" cy="30" r="18" stroke="%234f46e5" stroke-width="4"/><circle cx="35" cy="30" r="10" stroke="%234f46e5" stroke-width="3"/><text x="65" y="38" font-family="Arial, sans-serif" font-weight="900" font-size="24" fill="%231e1b4b">Deep10x</text></svg>`;

// Default Course Body Description Template
const DEFAULT_COURSE_DESCRIPTION = `This 3-month program provided foundational training in medical billing and coding for entry-level roles. Students learned coding principles, claims processing, insurance billing, and healthcare compliance. The course emphasized practical skills through hands-on exercises using PracticeMate software with dummy data, allowing students to simulate real-world billing tasks like claim submissions, payment posting, and denial management.`;

const CertificateModal = ({ student, onClose, onSuccess }) => {
    const { courses, batches, settings } = useApp();
    const certCanvasRef = useRef(null);

    // Enrollments calculation
    const studentEnrollments = student?.Enrollments || [];

    // Selected Course state
    const [selectedEnrollment, setSelectedEnrollment] = useState(null);
    const [step, setStep] = useState('select_course'); // 'select_course' | 'editor'

    // Certificate Editable Form Fields
    const [studentName, setStudentName] = useState(student?.name || '');
    const [courseName, setCourseName] = useState('');
    const [batchTitle, setBatchTitle] = useState('');
    const [issueDate, setIssueDate] = useState(() => {
        const today = new Date();
        return `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
    });
    const [certNo, setCertNo] = useState(() => `MB-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`);
    const [collaborationText, setCollaborationText] = useState('DEEP10X Billing Company, USA');
    const [collaborationLogo, setCollaborationLogo] = useState(DEFAULT_DEEP10X_LOGO);
    const [descriptionText, setDescriptionText] = useState(DEFAULT_COURSE_DESCRIPTION);
    const [signatoryName, setSignatoryName] = useState('Ms. Sadia K');
    const [signatoryTitle, setSignatoryTitle] = useState('Hunar Asaan Skills Centre');
    const [goldenBadgePreset, setGoldenBadgePreset] = useState('gold_ribbon_classic');
    const [customBadgeUrl, setCustomBadgeUrl] = useState(null);

    // Saving & Action States
    const [saving, setSaving] = useState(false);
    const [sendingMail, setSendingMail] = useState(false);
    const [activeTab, setActiveTab] = useState('preview'); // 'preview' | 'edit'

    // Initialize course/batch when enrollment is chosen
    useEffect(() => {
        if (studentEnrollments.length === 1) {
            handleSelectEnrollment(studentEnrollments[0]);
        } else if (studentEnrollments.length === 0) {
            // Default fallback if no enrollments
            setCourseName(student?.Course?.name || 'Medical Billing & Coding Short Course');
            setBatchTitle(student?.Batch?.name || student?.Batch?.batchName || 'Batch 1');
            setStep('editor');
        }
    }, []);

    const handleSelectEnrollment = (enr) => {
        setSelectedEnrollment(enr);
        const cName = enr.Course?.name || student?.Course?.name || 'Medical Billing & Coding Short Course';
        const bTitle = enr.Batch?.name || enr.Batch?.batchName || student?.Batch?.name || student?.Batch?.batchName || 'Batch 1';
        setCourseName(cName);
        setBatchTitle(bTitle);
        setStep('editor');
    };

    // Handle Custom Logo File Upload
    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (uploadEvent) => {
                setCollaborationLogo(uploadEvent.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle Custom Badge Upload
    const handleBadgeUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (uploadEvent) => {
                setCustomBadgeUrl(uploadEvent.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Save Certificate to Database
    const handleSaveCertificate = async () => {
        setSaving(true);
        try {
            // Generate PDF base64
            let pdfBase64 = null;
            if (certCanvasRef.current) {
                const res = await generateCertificatePDF(certCanvasRef.current, `Cert_${certNo}.pdf`, true);
                pdfBase64 = res.pdfBase64;
            }

            const payload = {
                certificateNo: certNo,
                studentId: student.id,
                courseId: selectedEnrollment?.courseId || student?.courseId || null,
                batchId: selectedEnrollment?.batchId || student?.batchId || null,
                studentName,
                courseName,
                batchTitle,
                issueDate,
                collaborationText,
                collaborationLogo,
                goldenBadgeUrl: customBadgeUrl || goldenBadgePreset,
                descriptionText,
                signatoryName,
                signatoryTitle,
                pdfBase64
            };

            const res = await apiClient.post('/certificates', payload);
            toast.success('Certificate saved to student profile! 🎉');
            const certObj = res?.certificate || res?.data?.certificate || res;
            if (onSuccess) onSuccess(certObj);
            return certObj;
        } catch (err) {
            console.error('Failed to save certificate:', err);
            toast.error(err.response?.data?.message || err?.message || 'Failed to save certificate');
            return null;
        } finally {
            setSaving(false);
        }
    };

    // Action: Download PDF
    const handleDownloadPDF = async () => {
        if (!certCanvasRef.current) return;
        const toastId = toast.loading('Generating PDF Certificate...');
        try {
            await generateCertificatePDF(certCanvasRef.current, `Certificate_${studentName.replace(/\s+/g, '_')}_${certNo}.pdf`);
            toast.success('Certificate downloaded successfully! 📄', { id: toastId });
            // Auto save to DB in background
            handleSaveCertificate();
        } catch (err) {
            toast.error('Failed to download PDF', { id: toastId });
        }
    };

    // Action: Share via WhatsApp
    const handleShareWhatsApp = async () => {
        let phone = student?.phone ? student.phone.replace(/[^0-9]/g, '') : '';
        if (phone.startsWith('03') && phone.length === 11) {
            phone = '92' + phone.substring(1);
        }
        const msg = encodeURIComponent(
            `Hi ${studentName}! 🎓\n\nCongratulations on completing your course *${courseName}* at Hunar Asaan Skills Centre!\n\nYour Certificate No is: *${certNo}*\nIssued Date: ${issueDate}\n\nBest wishes,\nHunar Asaan Team`
        );
        const waUrl = phone ? `https://wa.me/${phone}?text=${msg}` : `https://wa.me/?text=${msg}`;
        window.open(waUrl, '_blank');
        toast.success('Opening WhatsApp... 💬');
    };

    // Action: Send via Email
    const handleSendEmail = async () => {
        setSendingMail(true);
        const toastId = toast.loading(`Sending certificate email to ${student?.email || 'student'}...`);
        try {
            // First ensure certificate is saved to DB
            const savedCert = await handleSaveCertificate();
            if (!savedCert) {
                toast.error('Could not save certificate before emailing.', { id: toastId });
                return;
            }

            // Get base64 for attachment
            let pdfBase64 = null;
            if (certCanvasRef.current) {
                const res = await generateCertificatePDF(certCanvasRef.current, `Cert_${certNo}.pdf`, true);
                pdfBase64 = res.pdfBase64;
            }

            const emailRes = await apiClient.post(`/certificates/${savedCert.id}/send-email`, {
                recipientEmail: student?.email,
                pdfBase64
            });

            toast.success(emailRes?.message || emailRes?.data?.message || 'Certificate email sent! ✉️', { id: toastId });
        } catch (err) {
            console.error('Email error:', err);
            toast.error(err.response?.data?.message || 'Failed to send email', { id: toastId });
        } finally {
            setSendingMail(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[120] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-teal-900 text-white p-5 px-8 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
                            <Award size={22} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black tracking-tight">Official Certificate Generator</h2>
                            <p className="text-xs text-teal-200/80 font-medium">Hunar Asaan Skills Centre • Certificate System</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Step 1: Course Selection Modal (If student has multiple courses) */}
                {step === 'select_course' && studentEnrollments.length > 1 && (
                    <div className="p-8 sm:p-12 text-center overflow-y-auto flex-1">
                        <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
                            <BookOpen size={32} />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">Select Course for Certificate</h3>
                        <p className="text-sm text-slate-500 max-w-md mx-auto mb-8">
                            <strong>{studentName}</strong> is enrolled in multiple courses. Choose which course completion certificate you want to issue:
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                            {studentEnrollments.map((enr) => (
                                <button
                                    key={enr.id}
                                    onClick={() => handleSelectEnrollment(enr)}
                                    className="p-5 rounded-2xl border-2 border-slate-100 hover:border-teal-500 hover:bg-teal-50/50 text-left transition-all group flex flex-col justify-between"
                                >
                                    <div>
                                        <span className="text-[10px] font-black tracking-wider uppercase bg-teal-100 text-teal-800 px-2.5 py-1 rounded-full">
                                            {enr.Course?.code || 'COURSE'}
                                        </span>
                                        <h4 className="text-base font-bold text-slate-800 mt-2 group-hover:text-teal-700">
                                            {enr.Course?.name || 'Enrolled Course'}
                                        </h4>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Batch: {enr.Batch?.name || enr.Batch?.batchName || 'Default Batch'}
                                        </p>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-teal-600">
                                        <span>Issue Certificate</span>
                                        <Sparkles size={14} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 2: Editor & Live Certificate Canvas */}
                {(step === 'editor' || studentEnrollments.length <= 1) && (
                    <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-50">
                        
                        {/* Editor Controls Sidebar */}
                        <div className="w-full md:w-96 bg-white border-r border-slate-200 flex flex-col h-full overflow-y-auto flex-shrink-0">
                            {/* Tabs */}
                            <div className="flex border-b border-slate-100 p-2 gap-2 bg-slate-50 flex-shrink-0">
                                <button 
                                    onClick={() => setActiveTab('preview')}
                                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'preview' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-800'}`}
                                >
                                    👁️ Certificate Details
                                </button>
                                <button 
                                    onClick={() => setActiveTab('edit')}
                                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'edit' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-800'}`}
                                >
                                    ✏️ Customise Text & Logos
                                </button>
                            </div>

                            <div className="p-5 flex-1 overflow-y-auto space-y-4">
                                {activeTab === 'preview' ? (
                                    <>
                                        <div className="bg-teal-50 border border-teal-200/60 rounded-2xl p-4">
                                            <p className="text-xs font-semibold text-teal-900">
                                                💡 <strong>Auto-Fetched Data:</strong> Student name, course, batch, date, and certificate # have been auto-populated.
                                            </p>
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Student Full Name</label>
                                            <input 
                                                type="text" 
                                                value={studentName}
                                                onChange={(e) => setStudentName(e.target.value)}
                                                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:border-teal-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Course Title</label>
                                            <input 
                                                type="text" 
                                                value={courseName}
                                                onChange={(e) => setCourseName(e.target.value)}
                                                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:border-teal-500"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Issue Date</label>
                                                <input 
                                                    type="text" 
                                                    value={issueDate}
                                                    onChange={(e) => setIssueDate(e.target.value)}
                                                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Certificate #</label>
                                                <input 
                                                    type="text" 
                                                    value={certNo}
                                                    onChange={(e) => setCertNo(e.target.value)}
                                                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Collaboration Partner</label>
                                            <input 
                                                type="text" 
                                                value={collaborationText}
                                                onChange={(e) => setCollaborationText(e.target.value)}
                                                placeholder="e.g. DEEP10X Billing Company, USA"
                                                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Golden Ribbon Seal</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {GOLDEN_BADGE_PRESETS.map((badge) => (
                                                    <button
                                                        key={badge.id}
                                                        type="button"
                                                        onClick={() => { setGoldenBadgePreset(badge.id); setCustomBadgeUrl(null); }}
                                                        className={`p-2 rounded-xl border flex items-center gap-2 text-left ${goldenBadgePreset === badge.id && !customBadgeUrl ? 'border-teal-500 bg-teal-50' : 'border-slate-200 hover:bg-slate-50'}`}
                                                    >
                                                        <div className="w-7 h-7" dangerouslySetInnerHTML={{ __html: badge.svg }} />
                                                        <span className="text-[10px] font-bold text-slate-700 leading-tight">{badge.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Upload Partner Logo</label>
                                            <input 
                                                type="file" 
                                                accept="image/*"
                                                onChange={handleLogoUpload}
                                                className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Upload Custom Golden Badge PNG</label>
                                            <input 
                                                type="file" 
                                                accept="image/*"
                                                onChange={handleBadgeUpload}
                                                className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Body Description Paragraph</label>
                                            <textarea 
                                                rows={5}
                                                value={descriptionText}
                                                onChange={(e) => setDescriptionText(e.target.value)}
                                                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed focus:outline-none focus:border-teal-500"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Signatory Name</label>
                                                <input 
                                                    type="text" 
                                                    value={signatoryName}
                                                    onChange={(e) => setSignatoryName(e.target.value)}
                                                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Signatory Title</label>
                                                <input 
                                                    type="text" 
                                                    value={signatoryTitle}
                                                    onChange={(e) => setSignatoryTitle(e.target.value)}
                                                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800"
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Certificate Canvas Live Preview */}
                        <div className="flex-1 p-2 sm:p-6 flex items-center justify-center overflow-x-hidden overflow-y-auto bg-slate-200/80 min-h-[360px] sm:min-h-[450px]">
                            
                            {/* Scaled Container for Modal Preview */}
                            <div className="transform scale-[0.38] min-[420px]:scale-[0.46] sm:scale-[0.68] md:scale-[0.78] lg:scale-[0.88] xl:scale-[0.95] origin-top sm:origin-center transition-all duration-300 my-auto">
                                
                                {/* Printable Certificate Frame (Fixed A4 Landscape 842px x 595px) */}
                                <div className="w-[842px] h-[595px] bg-white shadow-2xl rounded-sm p-8 relative flex flex-col justify-between text-slate-800 border-[10px] border-double border-slate-400 select-none shrink-0" ref={certCanvasRef} style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>
                                    
                                    {/* Inner Decorative Frame Border */}
                                    <div className="absolute inset-2 border-2 border-slate-300 pointer-events-none" />
                                    <div className="absolute inset-3 border border-slate-200 pointer-events-none" />

                                    {/* Top Header Info Bar */}
                                    <div className="flex items-center justify-between text-[11px] font-mono font-semibold text-slate-500 mb-1 relative z-10">
                                        <div className="border-b border-blue-400/40 pb-0.5">
                                            DATE: <span className="text-slate-800 font-bold">{issueDate}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-800 font-bold">{certNo}</span>
                                        </div>
                                    </div>

                                    {/* Logos Row */}
                                    <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2 relative z-10">
                                        {/* Partner Logo */}
                                        <div className="h-12 flex items-center">
                                            {collaborationLogo ? (
                                                <img src={collaborationLogo} alt="Partner Logo" className="max-h-12 max-w-[180px] object-contain" />
                                            ) : (
                                                <span className="text-xs font-bold text-indigo-700">{collaborationText}</span>
                                            )}
                                        </div>

                                        {/* Hunar Asaan Institute Logo */}
                                        <div className="h-12 flex items-center gap-2">
                                            <img src={logoBase64} alt="Hunar Asaan Logo" className="max-h-12 object-contain" />
                                        </div>
                                    </div>

                                    {/* Main Certificate Text Body */}
                                    <div className="text-center my-auto py-1 relative z-10">
                                        <p className="text-xs font-serif italic text-slate-700 tracking-wide mb-1">
                                            This is to certify that
                                        </p>

                                        {/* Student Name */}
                                        <h1 className="text-3xl font-serif font-bold text-slate-900 tracking-tight my-1 border-b border-slate-200 pb-1 inline-block px-8">
                                            {studentName || 'Student Name'}
                                        </h1>

                                        <p className="text-xs font-serif italic text-slate-700 tracking-wide my-1">
                                            has successfully completed the
                                        </p>

                                        {/* Course Name */}
                                        <h2 className="text-lg font-bold uppercase tracking-wider text-blue-900 my-1 max-w-xl mx-auto">
                                            {courseName || 'COURSE NAME'}
                                        </h2>

                                        <p className="text-xs font-semibold text-slate-700 my-1">
                                            offered by <strong className="text-slate-900">Hunar Asaan Skills Centre</strong> in collaboration with <strong className="text-slate-900">{collaborationText}</strong>
                                        </p>

                                        {/* Description Paragraph */}
                                        <p className="text-[10px] text-slate-600 max-w-2xl mx-auto leading-relaxed my-2 text-justify px-4">
                                            {descriptionText}
                                        </p>
                                    </div>

                                    {/* Bottom Signatures & Seal Section */}
                                    <div className="flex items-end justify-between pt-2 relative z-10">
                                        
                                        {/* Golden Badge Seal (Bottom-Left) */}
                                        <div className="w-16 h-16 relative flex items-center justify-center">
                                            {customBadgeUrl ? (
                                                <img src={customBadgeUrl} alt="Golden Badge" className="w-16 h-16 object-contain" />
                                            ) : (
                                                <div 
                                                    className="w-16 h-16 drop-shadow-md" 
                                                    dangerouslySetInnerHTML={{ 
                                                        __html: GOLDEN_BADGE_PRESETS.find(b => b.id === goldenBadgePreset)?.svg || GOLDEN_BADGE_PRESETS[0].svg 
                                                    }} 
                                                />
                                            )}
                                        </div>

                                        {/* Signature Block (Bottom-Right) */}
                                        <div className="text-right">
                                            <div className="h-8 mb-1 flex items-end justify-end">
                                                {/* Stylized Signature */}
                                                <span className="font-serif italic text-xl text-slate-800 font-bold border-b border-slate-400 px-4">
                                                    {signatoryName}
                                                </span>
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-800">{signatoryName}</p>
                                            <p className="text-[9px] text-slate-500 font-medium">{signatoryTitle}</p>
                                        </div>
                                    </div>

                                    {/* Footer Verification Line */}
                                    <div className="border-t border-slate-200 pt-1.5 text-[8px] text-center text-slate-400 font-mono mt-1 relative z-10">
                                        This certificate is verifiable through <strong>Hunar Asaan Skills Centre</strong> by referencing the Certificate No. For verification, contact: sadia@hunarasaan.com
                                    </div>

                                </div>
                            </div>
                        </div>

                    </div>
                )}

                {/* Footer Action Controls */}
                <div className="p-4 px-8 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleSaveCertificate}
                            disabled={saving}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                        >
                            <Check size={14} />
                            {saving ? 'Saving...' : 'Save to Profile'}
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleShareWhatsApp}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 shadow-md shadow-emerald-600/20"
                        >
                            <Share2 size={14} />
                            Share WhatsApp
                        </button>

                        <button
                            onClick={handleSendEmail}
                            disabled={sendingMail}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 shadow-md shadow-blue-600/20 disabled:opacity-50"
                        >
                            <Mail size={14} />
                            {sendingMail ? 'Sending Email...' : 'Send via Email'}
                        </button>

                        <button
                            onClick={handleDownloadPDF}
                            className="px-5 py-2 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-teal-600/20"
                        >
                            <Download size={14} />
                            Download PDF
                        </button>
                    </div>
                </div>

            </motion.div>
        </div>
    );
};

export default CertificateModal;
