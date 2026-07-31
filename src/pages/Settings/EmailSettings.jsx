import React, { useState, useEffect } from 'react';
import { Mail, Plus, Trash2, ShieldAlert, User, Shield, Briefcase, PlusCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EmailSettings = ({ formData, setFormData }) => {
  const [newStaffLabel, setNewStaffLabel] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newCcEmail, setNewCcEmail] = useState('');
  const [ccError, setCcError] = useState('');
  const [staffError, setStaffError] = useState('');

  // Local state for list views
  const [staffList, setStaffList] = useState([]);
  const [ccList, setCcList] = useState([]);

  // Local state for notification rules
  const [rules, setRules] = useState({
    admission: { enabled: true, primaryAdmin: true, operations: true, ccList: true, student: true },
    payment: { enabled: true, accounts: true, primaryAdmin: true, ccList: true, student: true },
    updates: { enabled: true, allStaff: true, ccList: true },
    overdue: { enabled: true, student: true, accountsCc: true }
  });

  useEffect(() => {
    // Parse staffRecipients from formData
    if (formData.staffRecipients) {
      try {
        const parsed = typeof formData.staffRecipients === 'string'
          ? JSON.parse(formData.staffRecipients)
          : formData.staffRecipients;
        setStaffList(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        setStaffList([]);
      }
    } else {
      setStaffList([]);
    }

    // Parse globalCcEmails from comma-separated string
    if (formData.globalCcEmails) {
      const splitEmails = formData.globalCcEmails.split(',')
        .map(e => e.trim())
        .filter(Boolean);
      setCcList(splitEmails);
    } else {
      setCcList([]);
    }

    // Parse notificationRules from formData
    if (formData.notificationRules) {
      try {
        const parsed = typeof formData.notificationRules === 'string'
          ? JSON.parse(formData.notificationRules)
          : formData.notificationRules;
        
        setRules(prev => ({
          admission: { ...prev.admission, ...(parsed.admission || {}) },
          payment: { ...prev.payment, ...(parsed.payment || {}) },
          updates: { ...prev.updates, ...(parsed.updates || {}) },
          overdue: { ...prev.overdue, ...(parsed.overdue || {}) }
        }));
      } catch (e) {
        console.error('Failed to parse notificationRules:', e);
      }
    }
  }, [formData.staffRecipients, formData.globalCcEmails, formData.notificationRules]);

  // Synchronize local state changes back to parent formData
  const syncStaffList = (updatedList) => {
    setStaffList(updatedList);
    setFormData(prev => ({
      ...prev,
      staffRecipients: JSON.stringify(updatedList)
    }));
  };

  const syncCcList = (updatedList) => {
    setCcList(updatedList);
    setFormData(prev => ({
      ...prev,
      globalCcEmails: updatedList.join(', ')
    }));
  };

  const syncRules = (updatedRules) => {
    setRules(updatedRules);
    setFormData(prev => ({
      ...prev,
      notificationRules: JSON.stringify(updatedRules)
    }));
  };

  const handleToggleMaster = (category) => {
    const updated = {
      ...rules,
      [category]: {
        ...rules[category],
        enabled: !rules[category].enabled
      }
    };
    syncRules(updated);
  };

  const handleToggleRuleCheckbox = (category, key) => {
    const updated = {
      ...rules,
      [category]: {
        ...rules[category],
        [key]: !rules[category][key]
      }
    };
    syncRules(updated);
  };

  // Validators
  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Add Custom Staff Recipient
  const handleAddStaff = () => {
    setStaffError('');
    if (!newStaffLabel.trim()) {
      setStaffError('Label is required (e.g., Admission Officer).');
      return;
    }
    if (!newStaffEmail.trim()) {
      setStaffError('Email address is required.');
      return;
    }
    if (!validateEmail(newStaffEmail)) {
      setStaffError('Please enter a valid email address.');
      return;
    }
    if (staffList.some(s => s.email.toLowerCase() === newStaffEmail.toLowerCase())) {
      setStaffError('This email is already in the staff recipients list.');
      return;
    }

    const updated = [...staffList, { label: newStaffLabel.trim(), email: newStaffEmail.trim() }];
    syncStaffList(updated);
    setNewStaffLabel('');
    setNewStaffEmail('');
  };

  // Remove Custom Staff Recipient
  const handleRemoveStaff = (indexToRemove) => {
    const updated = staffList.filter((_, idx) => idx !== indexToRemove);
    syncStaffList(updated);
  };

  // Add CC Tag
  const handleAddCc = (e) => {
    if (e) e.preventDefault();
    setCcError('');
    if (!newCcEmail.trim()) return;

    if (!validateEmail(newCcEmail)) {
      setCcError('Please enter a valid email address.');
      return;
    }
    if (ccList.some(email => email.toLowerCase() === newCcEmail.toLowerCase())) {
      setCcError('This email is already in the CC list.');
      return;
    }

    const updated = [...ccList, newCcEmail.trim()];
    syncCcList(updated);
    setNewCcEmail('');
  };

  // Remove CC Tag
  const handleRemoveCc = (indexToRemove) => {
    const updated = ccList.filter((_, idx) => idx !== indexToRemove);
    syncCcList(updated);
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-3 duration-500">
      {/* ── Section 1: Main Notification Routing ── */}
      <div className="glass-card p-10 bg-white shadow-2xl border border-slate-100 relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-secondary" />
        <h3 className="text-2xl font-black text-slate-800 tracking-tighter flex items-center gap-4 uppercase mb-8">
          <div className="w-12 h-12 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center shadow-inner"><Mail size={24} /></div>
          Main Administrative Email Routing
        </h3>
        
        <p className="text-xs font-semibold text-slate-400 mb-8 leading-relaxed uppercase tracking-wider">
          Configure default override target mailboxes for system-wide automated email alerts. If empty, notifications fallback to active system administrators.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Primary Admin */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-1.5">
              <Shield size={12} className="text-slate-400" />
              Primary Admin Email
            </label>
            <input 
              type="email"
              className="input-field bg-slate-50 focus:bg-white border-transparent focus:border-secondary/20" 
              placeholder="e.g. admin@ims.hunarasaan.com" 
              value={formData.primaryAdminEmail || ''} 
              onChange={e => setFormData({ ...formData, primaryAdminEmail: e.target.value })} 
            />
            <p className="text-[9px] text-slate-400/80 font-bold uppercase tracking-wider pl-1">Target for login & security alerts</p>
          </div>

          {/* Accounts Team */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-1.5">
              <User size={12} className="text-slate-400" />
              Accounts Team Email
            </label>
            <input 
              type="email"
              className="input-field bg-slate-50 focus:bg-white border-transparent focus:border-secondary/20" 
              placeholder="e.g. billing@ims.hunarasaan.com" 
              value={formData.accountsEmail || ''} 
              onChange={e => setFormData({ ...formData, accountsEmail: e.target.value })} 
            />
            <p className="text-[9px] text-slate-400/80 font-bold uppercase tracking-wider pl-1">Target for ledger & payment vouchers</p>
          </div>

          {/* Operations Lead */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-1.5">
              <Briefcase size={12} className="text-slate-400" />
              Operations Lead Email
            </label>
            <input 
              type="email"
              className="input-field bg-slate-50 focus:bg-white border-transparent focus:border-secondary/20" 
              placeholder="e.g. operations@ims.hunarasaan.com" 
              value={formData.operationsEmail || ''} 
              onChange={e => setFormData({ ...formData, operationsEmail: e.target.value })} 
            />
            <p className="text-[9px] text-slate-400/80 font-bold uppercase tracking-wider pl-1">Target for student registration updates</p>
          </div>
        </div>
      </div>

      {/* ── Section 2: Notification Event & Recipient Toggles ── */}
      <div className="glass-card p-10 bg-white shadow-2xl border border-slate-100 relative">
        <h3 className="text-2xl font-black text-slate-800 tracking-tighter flex items-center gap-4 uppercase mb-8">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shadow-inner"><Shield size={24} /></div>
          Notification Event & Recipient Toggles
        </h3>
        
        <p className="text-xs font-semibold text-slate-400 mb-8 leading-relaxed uppercase tracking-wider">
          Customize alert distribution rules for major system events. Enable or disable categories, and select specific recipient channels.
        </p>

        <div className="space-y-6">
          {/* Card 1: Student Admission Alert */}
          <div className={`p-6 rounded-3xl border transition-all duration-300 ${rules.admission.enabled ? 'bg-white border-slate-100 shadow-md' : 'bg-slate-50 border-slate-100 opacity-75'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-2xl ${rules.admission.enabled ? 'bg-secondary/10 text-secondary' : 'bg-slate-200 text-slate-400'}`}>
                  <User size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-700 uppercase tracking-tight">Student Admission Alert</h4>
                  <p className="text-xs text-slate-400 font-semibold mt-1">Dispatched when a student completes registration.</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-black uppercase tracking-wider ${rules.admission.enabled ? 'text-secondary' : 'text-slate-400'}`}>
                  {rules.admission.enabled ? 'Active' : 'Disabled'}
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={rules.admission.enabled} 
                    onChange={() => handleToggleMaster('admission')}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
                </label>
              </div>
            </div>

            <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 transition-all duration-300 ${rules.admission.enabled ? '' : 'pointer-events-none opacity-50'}`}>
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <input 
                  type="checkbox" 
                  checked={rules.admission.primaryAdmin} 
                  onChange={() => handleToggleRuleCheckbox('admission', 'primaryAdmin')}
                  className="rounded text-secondary focus:ring-secondary h-4 w-4" 
                />
                <span className="text-xs font-semibold text-slate-600">Send to Primary Admin</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <input 
                  type="checkbox" 
                  checked={rules.admission.operations} 
                  onChange={() => handleToggleRuleCheckbox('admission', 'operations')}
                  className="rounded text-secondary focus:ring-secondary h-4 w-4" 
                />
                <span className="text-xs font-semibold text-slate-600">Send to Operations</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <input 
                  type="checkbox" 
                  checked={rules.admission.ccList} 
                  onChange={() => handleToggleRuleCheckbox('admission', 'ccList')}
                  className="rounded text-secondary focus:ring-secondary h-4 w-4" 
                />
                <span className="text-xs font-semibold text-slate-600">Send to CC List</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <input 
                  type="checkbox" 
                  checked={rules.admission.student} 
                  onChange={() => handleToggleRuleCheckbox('admission', 'student')}
                  className="rounded text-secondary focus:ring-secondary h-4 w-4" 
                />
                <span className="text-xs font-semibold text-slate-600">Send Confirmation to Student</span>
              </label>
            </div>
          </div>

          {/* Card 2: Fee & Payment Receipt Alert */}
          <div className={`p-6 rounded-3xl border transition-all duration-300 ${rules.payment.enabled ? 'bg-white border-slate-100 shadow-md' : 'bg-slate-50 border-slate-100 opacity-75'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-2xl ${rules.payment.enabled ? 'bg-secondary/10 text-secondary' : 'bg-slate-200 text-slate-400'}`}>
                  <Briefcase size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-700 uppercase tracking-tight">Fee & Payment Receipt Alert</h4>
                  <p className="text-xs text-slate-400 font-semibold mt-1">Dispatched upon processing student fees or payment installments.</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-black uppercase tracking-wider ${rules.payment.enabled ? 'text-secondary' : 'text-slate-400'}`}>
                  {rules.payment.enabled ? 'Active' : 'Disabled'}
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={rules.payment.enabled} 
                    onChange={() => handleToggleMaster('payment')}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
                </label>
              </div>
            </div>

            <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 transition-all duration-300 ${rules.payment.enabled ? '' : 'pointer-events-none opacity-50'}`}>
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <input 
                  type="checkbox" 
                  checked={rules.payment.accounts} 
                  onChange={() => handleToggleRuleCheckbox('payment', 'accounts')}
                  className="rounded text-secondary focus:ring-secondary h-4 w-4" 
                />
                <span className="text-xs font-semibold text-slate-600">Send to Accounts Email</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <input 
                  type="checkbox" 
                  checked={rules.payment.primaryAdmin} 
                  onChange={() => handleToggleRuleCheckbox('payment', 'primaryAdmin')}
                  className="rounded text-secondary focus:ring-secondary h-4 w-4" 
                />
                <span className="text-xs font-semibold text-slate-600">Send to Primary Admin</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <input 
                  type="checkbox" 
                  checked={rules.payment.ccList} 
                  onChange={() => handleToggleRuleCheckbox('payment', 'ccList')}
                  className="rounded text-secondary focus:ring-secondary h-4 w-4" 
                />
                <span className="text-xs font-semibold text-slate-600">Send to CC List</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <input 
                  type="checkbox" 
                  checked={rules.payment.student} 
                  onChange={() => handleToggleRuleCheckbox('payment', 'student')}
                  className="rounded text-secondary focus:ring-secondary h-4 w-4" 
                />
                <span className="text-xs font-semibold text-slate-600">Send Receipt to Student</span>
              </label>
            </div>
          </div>

          {/* Card 3: System & Platform Updates */}
          <div className={`p-6 rounded-3xl border transition-all duration-300 ${rules.updates.enabled ? 'bg-white border-slate-100 shadow-md' : 'bg-slate-50 border-slate-100 opacity-75'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-2xl ${rules.updates.enabled ? 'bg-secondary/10 text-secondary' : 'bg-slate-200 text-slate-400'}`}>
                  <Shield size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-700 uppercase tracking-tight">System & Platform Updates</h4>
                  <p className="text-xs text-slate-400 font-semibold mt-1">Dispatched for general announcements, updates, or maintenance notes.</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-black uppercase tracking-wider ${rules.updates.enabled ? 'text-secondary' : 'text-slate-400'}`}>
                  {rules.updates.enabled ? 'Active' : 'Disabled'}
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={rules.updates.enabled} 
                    onChange={() => handleToggleMaster('updates')}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
                </label>
              </div>
            </div>

            <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 transition-all duration-300 ${rules.updates.enabled ? '' : 'pointer-events-none opacity-50'}`}>
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <input 
                  type="checkbox" 
                  checked={rules.updates.allStaff} 
                  onChange={() => handleToggleRuleCheckbox('updates', 'allStaff')}
                  className="rounded text-secondary focus:ring-secondary h-4 w-4" 
                />
                <span className="text-xs font-semibold text-slate-600">Send to All Staff Emails</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <input 
                  type="checkbox" 
                  checked={rules.updates.ccList} 
                  onChange={() => handleToggleRuleCheckbox('updates', 'ccList')}
                  className="rounded text-secondary focus:ring-secondary h-4 w-4" 
                />
                <span className="text-xs font-semibold text-slate-600">Send to CC List</span>
              </label>
            </div>
          </div>

          {/* Card 4: Overdue Fee Reminders */}
          <div className={`p-6 rounded-3xl border transition-all duration-300 ${rules.overdue.enabled ? 'bg-white border-slate-100 shadow-md' : 'bg-slate-50 border-slate-100 opacity-75'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-2xl ${rules.overdue.enabled ? 'bg-secondary/10 text-secondary' : 'bg-slate-200 text-slate-400'}`}>
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-700 uppercase tracking-tight">Overdue Fee Reminders</h4>
                  <p className="text-xs text-slate-400 font-semibold mt-1">Dispatched when alerting students of unpaid dues/installments.</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-black uppercase tracking-wider ${rules.overdue.enabled ? 'text-secondary' : 'text-slate-400'}`}>
                  {rules.overdue.enabled ? 'Active' : 'Disabled'}
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={rules.overdue.enabled} 
                    onChange={() => handleToggleMaster('overdue')}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
                </label>
              </div>
            </div>

            <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 transition-all duration-300 ${rules.overdue.enabled ? '' : 'pointer-events-none opacity-50'}`}>
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <input 
                  type="checkbox" 
                  checked={rules.overdue.student} 
                  onChange={() => handleToggleRuleCheckbox('overdue', 'student')}
                  className="rounded text-secondary focus:ring-secondary h-4 w-4" 
                />
                <span className="text-xs font-semibold text-slate-600">Send to Student</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <input 
                  type="checkbox" 
                  checked={rules.overdue.accountsCc} 
                  onChange={() => handleToggleRuleCheckbox('overdue', 'accountsCc')}
                  className="rounded text-secondary focus:ring-secondary h-4 w-4" 
                />
                <span className="text-xs font-semibold text-slate-600">Send Summary to Accounts & CC List</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 3: Custom Staff Recipients ── */}
      <div className="glass-card p-10 bg-white shadow-2xl border border-slate-100 relative">
        <h3 className="text-2xl font-black text-slate-800 tracking-tighter flex items-center gap-4 uppercase mb-8">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shadow-inner"><PlusCircle size={24} /></div>
          Custom Staff Recipient registry
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Staff form */}
          <div className="lg:col-span-1 p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Register Staff Recipient</h4>
            
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Designation/Label</label>
              <input 
                type="text" 
                className="input-field bg-white" 
                placeholder="e.g. Admission Officer" 
                value={newStaffLabel} 
                onChange={e => setNewStaffLabel(e.target.value)} 
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
              <input 
                type="email" 
                className="input-field bg-white" 
                placeholder="staff@ims.hunarasaan.com" 
                value={newStaffEmail} 
                onChange={e => setNewStaffEmail(e.target.value)} 
              />
            </div>

            {staffError && <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider">{staffError}</p>}

            <button 
              type="button" 
              onClick={handleAddStaff}
              className="w-full btn-secondary py-3 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Register Email
            </button>
          </div>

          {/* Staff List Grid */}
          <div className="lg:col-span-2 space-y-3 max-h-[300px] overflow-y-auto pr-2">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Registered Recipients ({staffList.length})</h4>
            
            {staffList.length === 0 ? (
              <div className="h-[200px] border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-300">
                <Mail size={40} className="stroke-[1.5] mb-2" />
                <span className="text-xs font-black uppercase tracking-widest">No custom recipients added</span>
              </div>
            ) : (
              <AnimatePresence>
                {staffList.map((staff, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm"
                  >
                    <div>
                      <span className="text-[8px] font-black uppercase bg-secondary/10 text-secondary px-2.5 py-1 rounded-full tracking-widest">{staff.label}</span>
                      <p className="text-sm font-bold text-slate-700 mt-1.5">{staff.email}</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => handleRemoveStaff(idx)}
                      className="p-3.5 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-sm"
                    >
                      <Trash2 size={16} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>

      {/* ── Section 4: Global CC (Carbon Copy) ── */}
      <div className="glass-card p-10 bg-white shadow-2xl border border-slate-100 relative">
        <h3 className="text-2xl font-black text-slate-800 tracking-tighter flex items-center gap-4 uppercase mb-8">
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner"><CheckCircle size={24} /></div>
          Global CC (Carbon Copy) Recipients list
        </h3>

        <p className="text-xs font-semibold text-slate-400 mb-8 leading-relaxed uppercase tracking-wider">
          Add list of CC addresses to automatically bind onto all transaction receipts and activity triggers processed by SMTP server.
        </p>

        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
              type="text" 
              className="input-field pl-12 bg-slate-50 focus:bg-white border-transparent focus:border-secondary/20" 
              placeholder="Enter email and press Add" 
              value={newCcEmail}
              onChange={e => setNewCcEmail(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCc(e);
                }
              }}
            />
          </div>
          <button 
            type="button"
            onClick={handleAddCc}
            className="btn-secondary py-4 px-8 font-black text-xs uppercase tracking-widest flex items-center gap-2"
          >
            <Plus size={16} /> Add CC
          </button>
        </div>

        {ccError && <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider mb-4">{ccError}</p>}

        <div className="flex flex-wrap gap-2.5 min-h-[50px] p-4 bg-slate-50 rounded-2xl border border-slate-100">
          {ccList.length === 0 ? (
            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest italic m-auto">No global CC emails added</span>
          ) : (
            ccList.map((email, idx) => (
              <span 
                key={idx}
                className="inline-flex items-center gap-2 bg-white text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 shadow-sm"
              >
                {email}
                <button 
                  type="button" 
                  onClick={() => handleRemoveCc(idx)} 
                  className="text-slate-400 hover:text-rose-500 font-bold text-sm leading-none focus:outline-none transition-colors"
                >
                  ×
                </button>
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailSettings;
