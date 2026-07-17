import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
    Settings as SettingsIcon, Globe, Mail, Shield, Save, Upload, Image as ImageIcon, Sparkles, Terminal, Phone, MapPin, Building, User, Hash, CreditCard
} from 'lucide-react';
import { motion } from 'framer-motion';

const Settings = () => {
    const { settings, updateSettings, loading } = useApp();
    const [logoPreview, setLogoPreview] = useState(null);
    const [logoFile, setLogoFile] = useState(null);
    const [formData, setFormData] = useState({
        instituteName: '',
        contact: '',
        address: '',
        emailServer: { host: '', port: '', user: '', pass: '' },
        bankName: '',
        accountTitle: '',
        accountNo: '',
        ibanCode: '',
        paymentInstructions: '',
        emailNotificationsEnabled: true
    });

    useEffect(() => {
        if (settings) {
            setFormData({
                instituteName: settings.instituteName || '',
                contact: settings.contact || '',
                address: settings.address || '',
                emailServer: settings.emailServer || { host: '', port: '587', user: '', pass: '' },
                bankName: settings.bankName || '',
                accountTitle: settings.accountTitle || '',
                accountNo: settings.accountNo || '',
                ibanCode: settings.ibanCode || '',
                paymentInstructions: settings.paymentInstructions || '',
                emailNotificationsEnabled: settings.emailNotificationsEnabled !== false
            });
            if (settings.logoUrl) {
                setLogoPreview(settings.logoUrl);
            }
        }
    }, [settings]);

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const submitData = new FormData();
        submitData.append('data', JSON.stringify(formData));
        if (logoFile) submitData.append('logo', logoFile);
        await updateSettings(submitData);
    };

    if (loading) return <div className="h-[80vh] flex items-center justify-center font-black text-slate-300 animate-pulse uppercase tracking-[0.5em]">Fetching System Config...</div>;

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-700 pb-20">
            <div className="flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <SettingsIcon size={16} className="text-secondary animate-spin-slow" />
                        <span className="text-xs font-black text-secondary uppercase tracking-[0.4em]">Global Core Config</span>
                    </div>
                    <h2 className="text-6xl font-black text-slate-800 tracking-tighter">System Control</h2>
                </div>
            </div>

            <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-1 space-y-8">
                    <div className="glass-card p-10 bg-white border border-slate-100 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-2 bg-secondary" />
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-8">Brand Vitals</p>

                        <div className="relative aspect-square rounded-[2.5rem] overflow-hidden bg-slate-50 border-4 border-dashed border-slate-100 group-hover:border-secondary/20 transition-all flex flex-col items-center justify-center">
                            {logoPreview ? (
                                <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-4" />
                            ) : (
                                <ImageIcon size={60} className="text-slate-200" />
                            )}
                            <label className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-all gap-4">
                                <div className="w-14 h-14 bg-secondary rounded-2xl flex items-center justify-center text-white shadow-xl"><Upload size={24} /></div>
                                <span className="text-xs font-black text-white uppercase tracking-widest">Update Identity</span>
                                <input type="file" className="hidden" onChange={handleLogoChange} />
                            </label>
                        </div>

                        <div className="mt-10 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 italic text-center">Current Institute Name</p>
                            <p className="font-black text-slate-800 text-center uppercase tracking-tighter text-lg">{formData.instituteName || 'Not Set'}</p>
                        </div>
                    </div>

                    <div className="bg-primary p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                        <Sparkles className="absolute -right-4 -bottom-4 text-white/5" size={200} />
                        <h4 className="font-black text-2xl tracking-tighter italic mb-6">Safe Mode</h4>
                        <p className="text-xs font-bold text-white/40 uppercase tracking-widest leading-loose">
                            Administrative overrides are locked to your secure session. Changes here reflect globally across all scholar vouchers and system logic.
                        </p>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-10">
                    <div className="glass-card p-10 bg-white shadow-2xl border border-slate-100 relative">
                        <div className="flex justify-between items-center mb-12">
                            <h3 className="text-2xl font-black text-slate-800 tracking-tighter flex items-center gap-4 uppercase">
                                <div className="w-12 h-12 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center shadow-inner"><Building size={24} /></div>
                                Institute Identity
                            </h3>
                            <button type="submit" className="btn-secondary py-4 px-10 font-black text-sm uppercase tracking-widest shadow-xl shadow-secondary/30 active:scale-95 transition-all flex items-center gap-3">
                                <Save size={20} /> Deploy Config
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Official Name</label>
                                <div className="relative">
                                    <Terminal className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                    <input className="input-field pl-12 bg-slate-50 focus:bg-white border-transparent focus:border-secondary/20" value={formData.instituteName} onChange={e => setFormData({ ...formData, instituteName: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Headquarters Contact</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                    <input className="input-field pl-12 bg-slate-50 focus:bg-white border-transparent focus:border-secondary/20" value={formData.contact} onChange={e => setFormData({ ...formData, contact: e.target.value })} />
                                </div>
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Geographic Registry (Address)</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                    <input className="input-field pl-12 bg-slate-50 focus:bg-white border-transparent focus:border-secondary/20" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Payment & Bank Configuration ── */}
                    <div className="glass-card p-10 bg-white shadow-2xl border border-slate-100 relative">
                        <div className="flex justify-between items-center mb-12">
                            <h3 className="text-2xl font-black text-slate-800 tracking-tighter flex items-center gap-4 uppercase">
                                <span className="p-3 bg-secondary/10 text-secondary rounded-2xl"><Building size={24} /></span>
                                Payment & Bank Configuration
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Bank Name</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Building size={16} className="text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.bankName}
                                        onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
                                        placeholder="e.g. Meezan Bank Ltd., Gulberg Branch"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Account Title</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <User size={16} className="text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.accountTitle}
                                        onChange={e => setFormData({ ...formData, accountTitle: e.target.value })}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
                                        placeholder="e.g. Hunar Asaan Skill Center"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Account No.</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Hash size={16} className="text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.accountNo}
                                        onChange={e => setFormData({ ...formData, accountNo: e.target.value })}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
                                        placeholder="e.g. 0110-1234567-001"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">IBAN Code</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <CreditCard size={16} className="text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.ibanCode}
                                        onChange={e => setFormData({ ...formData, ibanCode: e.target.value })}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
                                        placeholder="e.g. PK36 MEZN 0001 1012 3456 7001"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Payment Instructions (Optional)</label>
                            <textarea
                                value={formData.paymentInstructions}
                                onChange={e => setFormData({ ...formData, paymentInstructions: e.target.value })}
                                rows="3"
                                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all resize-none"
                                placeholder="Any additional notes to display on the receipt/challan..."
                            />
                        </div>
                    </div>

                    <div className="glass-card p-10 bg-white shadow-2xl border border-slate-100">
                        <h3 className="text-2xl font-black text-slate-800 tracking-tighter flex items-center gap-4 uppercase mb-12">
                            <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shadow-inner"><Mail size={24} /></div>
                            Automation SMTP logic
                        </h3>

                        <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-100">
                            <div>
                                <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Email Notifications Status</p>
                                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-1">Enable or disable all automated email alerts globally</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={formData.emailNotificationsEnabled} 
                                    onChange={e => setFormData({ ...formData, emailNotificationsEnabled: e.target.checked })}
                                    className="sr-only peer" 
                                />
                                <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
                            </label>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Provider Host</label>
                                <input className="input-field bg-slate-50 border-transparent" placeholder="smtp.gmail.com" value={formData.emailServer.host} onChange={e => setFormData({ ...formData, emailServer: { ...formData.emailServer, host: e.target.value } })} />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Server Port</label>
                                <input className="input-field bg-slate-50 border-transparent" placeholder="587" value={formData.emailServer.port} onChange={e => setFormData({ ...formData, emailServer: { ...formData.emailServer, port: e.target.value } })} />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">System Account (Email)</label>
                                <input className="input-field bg-slate-50 border-transparent" placeholder="admin@gmail.com" value={formData.emailServer.user} onChange={e => setFormData({ ...formData, emailServer: { ...formData.emailServer, user: e.target.value } })} />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Secure App Key (Pass)</label>
                                <input type="password" className="input-field bg-slate-50 border-transparent" placeholder="••••••••••••" value={formData.emailServer.pass} onChange={e => setFormData({ ...formData, emailServer: { ...formData.emailServer, pass: e.target.value } })} />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 p-8 bg-emerald-50 rounded-[2rem] border border-emerald-100 shadow-inner">
                        <Globe className="text-emerald-600" size={24} />
                        <div>
                            <p className="text-xs font-black text-emerald-800 uppercase tracking-tight italic">Registry Node Status: Verified & Operational</p>
                            <p className="text-[10px] text-emerald-600/60 font-black uppercase tracking-widest mt-1 leading-none">All communications are encrypted and logged.</p>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default Settings;
