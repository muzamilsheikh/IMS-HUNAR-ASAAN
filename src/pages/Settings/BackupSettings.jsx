import React, { useState, useEffect } from 'react';
import { Database, Download, Mail, RefreshCw, UploadCloud, ShieldAlert, Calendar, Check, AlertTriangle, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../../utils/api';
import toast from 'react-hot-toast';

const BackupSettings = ({ formData, setFormData }) => {
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // Fetch Backup logs history
  const fetchLogs = async () => {
    try {
      setLoadingLogs(true);
      const data = await apiClient.get('/settings/backup/logs');
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch backup logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Update schedule configurations in settings
  const handleUpdateSchedule = (frequency) => {
    setFormData(prev => ({
      ...prev,
      backupFrequency: frequency
    }));
  };

  const handleUpdateEmail = (e) => {
    setFormData(prev => ({
      ...prev,
      backupEmail: e.target.value
    }));
  };

  // Generate & Download Backup Now
  const handleDownloadBackup = async () => {
    try {
      setDownloading(true);
      const response = await apiClient.post('/settings/backup/generate', {}, { responseType: 'blob' });
      
      const blob = new Blob([response], { type: 'application/gzip' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `backup_${Date.now()}.sql.gz`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      
      toast.success('Database backup generated and downloaded!');
      fetchLogs();
    } catch (err) {
      console.error(err);
      toast.error('Failed to download database backup.');
    } finally {
      setDownloading(false);
    }
  };

  // Trigger Instant Backup & Email Now
  const handleEmailBackup = async () => {
    if (!formData.backupEmail) {
      toast.error('Please configure a backup target email first.');
      return;
    }
    try {
      setEmailing(true);
      await apiClient.post('/settings/backup/email', {});
      toast.success(`Backup archive successfully emailed to ${formData.backupEmail}`);
      fetchLogs();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to email backup.');
    } finally {
      setEmailing(false);
    }
  };

  // Download Stored Backups from Logs
  const handleDownloadStored = async (id, filename) => {
    try {
      const response = await apiClient.get(`/settings/backup/download/${id}`, { responseType: 'blob' });
      const blob = new Blob([response], { type: 'application/gzip' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success('Backup file downloaded successfully!');
    } catch (err) {
      console.error(err);
      toast.error('File no longer exists on server.');
    }
  };

  // Drag & Drop Handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      // Accept .sql, .json, .gz
      if (file.name.endsWith('.sql') || file.name.endsWith('.json') || file.name.endsWith('.gz')) {
        setSelectedFile(file);
        setShowConfirmModal(true);
      } else {
        toast.error('Only .sql, .json, or compressed .gz backup archives are supported.');
      }
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.endsWith('.sql') || file.name.endsWith('.json') || file.name.endsWith('.gz')) {
        setSelectedFile(file);
        setShowConfirmModal(true);
      } else {
        toast.error('Only .sql, .json, or compressed .gz backup archives are supported.');
      }
    }
  };

  // Restore Database trigger
  const handleRestoreDatabase = async () => {
    if (!selectedFile) return;
    try {
      setRestoring(true);
      setShowConfirmModal(false);

      const restoreFormData = new FormData();
      restoreFormData.append('backup', selectedFile);

      await apiClient.post('/settings/backup/restore', restoreFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Database successfully restored and synchronized!');
      setSelectedFile(null);
      fetchLogs();
      // Reload page to refresh system state context
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Database restore failed.');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-3 duration-500 pb-10">
      {/* ── Section 1: Backup Scheduling ── */}
      <div className="glass-card p-10 bg-white shadow-2xl border border-slate-100 relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-secondary" />
        <h3 className="text-2xl font-black text-slate-800 tracking-tighter flex items-center gap-4 uppercase mb-8">
          <div className="w-12 h-12 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center shadow-inner"><Calendar size={24} /></div>
          Automated Schedule & Mail Dispatch
        </h3>

        <p className="text-xs font-semibold text-slate-400 mb-8 leading-relaxed uppercase tracking-wider">
          Configure a system frequency schedule to automatically compile database archives and email them to secure offsite vaults.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-6">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 block">Schedule Frequency</label>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {['manual', 'daily', 'weekly', 'monthly'].map((freq) => (
                <button
                  key={freq}
                  type="button"
                  onClick={() => handleUpdateSchedule(freq)}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 relative ${
                    (formData.backupFrequency || 'manual') === freq
                      ? 'border-secondary bg-secondary/5 text-secondary shadow-md'
                      : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'
                  }`}
                >
                  {(formData.backupFrequency || 'manual') === freq && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-secondary text-white rounded-full flex items-center justify-center shadow"><Check size={12} /></div>
                  )}
                  <Database size={24} className={(formData.backupFrequency || 'manual') === freq ? 'text-secondary' : 'text-slate-400'} />
                  <span className="text-xs font-black uppercase tracking-wider">{freq}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1 space-y-4">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 block">Target Backup Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="email"
                className="input-field pl-12 bg-slate-50 focus:bg-white border-transparent focus:border-secondary/20"
                placeholder="e.g. backup@hunarasaan.com"
                value={formData.backupEmail || ''}
                onChange={handleUpdateEmail}
              />
            </div>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-relaxed">
              Automated archives will be dispatched here as .sql.gz attachments.
            </p>
          </div>
        </div>
      </div>

      {/* ── Section 2: On-Demand Controls & Import Dropzone ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Instant triggers */}
        <div className="lg:col-span-1 glass-card p-10 bg-white shadow-2xl border border-slate-100 space-y-8 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tighter flex items-center gap-3 uppercase mb-4">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl"><Play size={18} /></div>
              On-Demand Triggers
            </h3>
            <p className="text-xs text-slate-400 font-semibold leading-relaxed mb-6">
              Instantly backup the database. Download the SQL archive directly to your device or dispatch it to the offsite backup email address.
            </p>
          </div>

          <div className="space-y-4">
            <button
              type="button"
              disabled={downloading}
              onClick={handleDownloadBackup}
              className="w-full btn-primary py-4 px-6 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg active:scale-95 disabled:opacity-50"
            >
              <Download size={16} /> {downloading ? 'Downloading...' : 'Download Backup Now'}
            </button>

            <button
              type="button"
              disabled={emailing}
              onClick={handleEmailBackup}
              className="w-full btn-secondary py-4 px-6 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg active:scale-95 disabled:opacity-50"
            >
              <Mail size={16} /> {emailing ? 'Emailing...' : 'Send Backup to Email Now'}
            </button>
          </div>
        </div>

        {/* Database Restore Upload */}
        <div className="lg:col-span-2 glass-card p-10 bg-white shadow-2xl border border-slate-100 relative">
          <h3 className="text-xl font-black text-slate-800 tracking-tighter flex items-center gap-3 uppercase mb-4">
            <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl"><UploadCloud size={18} /></div>
            Import & Restore Database
          </h3>
          <p className="text-xs text-slate-400 font-semibold leading-relaxed mb-6">
            Overwrite the active database using a previously exported backup archive. Only `.sql`, `.json`, or compressed `.gz` files are allowed.
          </p>

          <div 
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-[2rem] p-10 flex flex-col items-center justify-center transition-all ${
              dragActive 
                ? 'border-secondary bg-secondary/5' 
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <UploadCloud size={48} className={dragActive ? 'text-secondary animate-bounce' : 'text-slate-300'} />
            <p className="text-sm font-black text-slate-700 uppercase tracking-tight mt-4">Drag and drop file here</p>
            <p className="text-xs text-slate-400 font-bold uppercase mt-1">or</p>
            
            <label className="mt-4 px-6 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-600 hover:bg-slate-100 cursor-pointer shadow-sm">
              Browse Files
              <input type="file" className="hidden" accept=".sql,.json,.gz" onChange={handleFileSelect} />
            </label>
          </div>
        </div>
      </div>

      {/* ── Section 3: Backup Logs History ── */}
      <div className="glass-card p-10 bg-white shadow-2xl border border-slate-100">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">Backup History Log</h3>
          <button 
            type="button" 
            onClick={fetchLogs} 
            disabled={loadingLogs}
            className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-sm flex items-center justify-center disabled:opacity-50"
          >
            <RefreshCw size={16} className={loadingLogs ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-slate-100 shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                <th className="p-5">Date & Time</th>
                <th className="p-5">Filename</th>
                <th className="p-5">Type</th>
                <th className="p-5 text-center">Status</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-xs text-slate-400 font-bold uppercase tracking-widest italic bg-slate-50/50">
                    No backup activity logged.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="p-5 text-xs font-semibold text-slate-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-5 text-xs font-bold text-slate-700 font-mono">
                      {log.filename}
                    </td>
                    <td className="p-5">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                        {log.type}
                      </span>
                    </td>
                    <td className="p-5 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        log.status === 'Success' 
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                          : 'bg-rose-50 text-rose-500 border border-rose-100'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${log.status === 'Success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {log.status}
                      </span>
                      {log.error && (
                        <p className="text-[9px] text-rose-400/80 font-bold mt-1 max-w-[200px] truncate m-auto" title={log.error}>
                          {log.error}
                        </p>
                      )}
                    </td>
                    <td className="p-5 text-right">
                      {log.status === 'Success' && log.type !== 'Import/Restore' ? (
                        <button
                          type="button"
                          onClick={() => handleDownloadStored(log.id, log.filename)}
                          className="p-2 text-secondary bg-secondary/5 hover:bg-secondary hover:text-white rounded-lg transition-all"
                          title="Download Backup File"
                        >
                          <Download size={14} />
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">N/A</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Confirm Database Restore Modal ── */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => { if (!restoring) setShowConfirmModal(false); }}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] p-10 max-w-lg w-full shadow-2xl relative border border-slate-100 z-10 text-center"
            >
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center m-auto shadow-inner mb-6">
                <AlertTriangle size={32} className="animate-pulse" />
              </div>

              <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Restore Database?</h4>
              
              <div className="my-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left space-y-3">
                <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                  You are about to initiate a database restoration operation. This action will perform the following destructive overrides:
                </p>
                <ul className="text-xs font-bold text-slate-600 list-disc list-inside space-y-1">
                  <li>Truncate/Clear all existing tables in the active node.</li>
                  <li>Restore table rows to match the uploaded file.</li>
                  <li>Existing database values will be completely overwritten.</li>
                </ul>
              </div>

              <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-8">
                Target File: {selectedFile?.name} ({selectedFile ? (selectedFile.size / 1024 / 1024).toFixed(2) : 0} MB)
              </p>

              <div className="flex gap-4">
                <button
                  type="button"
                  disabled={restoring}
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest rounded-2xl active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={restoring}
                  onClick={handleRestoreDatabase}
                  className="flex-1 py-4 bg-rose-500 hover:bg-rose-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl active:scale-95 transition-all shadow-lg shadow-rose-500/20"
                >
                  {restoring ? 'Restoring...' : 'Confirm Restore'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BackupSettings;
