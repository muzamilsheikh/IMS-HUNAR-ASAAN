import React, { useState } from 'react';
import { Shield, Plus, Trash2, Save, ChevronRight, AlertTriangle, Lock } from 'lucide-react';
import { useApp } from '../../context/AppContext';

// ─── Permission modules definition ───────────────────────────────────────────
const PERMISSION_MODULES = [
    {
        label: 'Students Management',
        icon: '👥',
        keys: [
            { key: 'viewStudentList',    label: 'View Student List' },
            { key: 'addStudent',         label: 'Direct Admission / Add Student' },
            { key: 'editDeleteStudent',  label: 'Edit / Delete Student' },
        ]
    },
    {
        label: 'Financials & Challans',
        icon: '💰',
        keys: [
            { key: 'viewChallans',      label: 'View Fee Challans' },
            { key: 'processPayments',   label: 'Process Payment Receipts' },
            { key: 'manageExpenses',    label: 'Manage Expenses' },
            { key: 'viewPayroll',       label: 'View Payroll' },
        ]
    },
    {
        label: 'Academics & Operations',
        icon: '🎓',
        keys: [
            { key: 'viewCreateBatches', label: 'View / Create Batches' },
            { key: 'viewManageCourses', label: 'View / Manage Courses' },
            { key: 'liveClassAccess',   label: 'Live Class Access' },
            { key: 'videoVaultAdmin',   label: 'Video Vault Admin' },
        ]
    },
    {
        label: 'Reports & System Control',
        icon: '📊',
        keys: [
            { key: 'accessReports',   label: 'Access Reports & Analytics' },
            { key: 'accessSettings',  label: 'Access System Settings' },
            { key: 'backupRestore',   label: 'Backup & Restore' },
        ]
    },
    {
        label: 'User & Navigation',
        icon: '🔑',
        keys: [
            { key: 'manageUsers',   label: 'Manage Users' },
            { key: 'viewCalendar',  label: 'View Calendar' },
            { key: 'viewChat',      label: 'View Chat' },
        ]
    },
];

const SYSTEM_ROLE_NAMES = ['admin', 'manager', 'accounts_manager', 'staff', 'student'];

// ─── Component ────────────────────────────────────────────────────────────────
const RolePermissionSettings = () => {
    const { roles, createRole, updateRolePerms, deleteRole } = useApp();
    const [selectedRoleId, setSelectedRoleId] = useState(null);
    const [localPerms, setLocalPerms] = useState({});
    const [permsDirty, setPermsDirty] = useState(false);
    const [saving, setSaving] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');
    const [creating, setCreating] = useState(false);
    const [showNewRoleInput, setShowNewRoleInput] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null);

    const selectedRole = roles.find(r => r.id === selectedRoleId) || null;

    const handleSelectRole = (role) => {
        if (permsDirty) {
            const ok = window.confirm('You have unsaved permission changes. Discard them?');
            if (!ok) return;
        }
        setSelectedRoleId(role.id);
        setLocalPerms({ ...role.permissions });
        setPermsDirty(false);
    };

    const handleToggle = (key) => {
        setLocalPerms(prev => ({ ...prev, [key]: !prev[key] }));
        setPermsDirty(true);
    };

    const handleSelectAll = (moduleKeys, value) => {
        setLocalPerms(prev => {
            const updated = { ...prev };
            moduleKeys.forEach(k => { updated[k] = value; });
            return updated;
        });
        setPermsDirty(true);
    };

    const handleSave = async () => {
        if (!selectedRole) return;
        setSaving(true);
        try {
            await updateRolePerms(selectedRole.id, localPerms);
            setPermsDirty(false);
        } finally {
            setSaving(false);
        }
    };

    const handleCreateRole = async () => {
        if (!newRoleName.trim()) return;
        setCreating(true);
        try {
            const newRole = await createRole({ name: newRoleName.trim() });
            setNewRoleName('');
            setShowNewRoleInput(false);
            handleSelectRole(newRole);
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteRole = async (role) => {
        setConfirmDelete(null);
        await deleteRole(role.id);
        if (selectedRoleId === role.id) {
            setSelectedRoleId(null);
            setLocalPerms({});
            setPermsDirty(false);
        }
    };

    const isSystemRole = (role) =>
        SYSTEM_ROLE_NAMES.includes(role.name.toLowerCase());

    return (
        <div className="flex gap-6 h-full min-h-[600px]">
            {/* ─── Left Panel: Role List ─────────────────────────────────────── */}
            <div className="w-72 flex-shrink-0 flex flex-col gap-3">
                {/* Header */}
                <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">System Roles</h3>
                    <button
                        onClick={() => setShowNewRoleInput(v => !v)}
                        className="w-8 h-8 rounded-xl bg-secondary/10 hover:bg-secondary text-secondary hover:text-white flex items-center justify-center transition-all active:scale-95"
                        title="Add New Role"
                    >
                        <Plus size={14} />
                    </button>
                </div>

                {/* New Role Input */}
                {showNewRoleInput && (
                    <div className="glass-card p-3 border border-secondary/20 bg-secondary/5 rounded-2xl flex gap-2">
                        <input
                            type="text"
                            value={newRoleName}
                            onChange={e => setNewRoleName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleCreateRole()}
                            placeholder="Role name…"
                            className="flex-1 text-xs bg-transparent outline-none text-slate-800 placeholder-slate-400 font-semibold"
                            autoFocus
                        />
                        <button
                            onClick={handleCreateRole}
                            disabled={creating || !newRoleName.trim()}
                            className="px-3 py-1.5 bg-secondary text-white text-[10px] font-black uppercase tracking-wider rounded-xl disabled:opacity-50 active:scale-95 transition-all"
                        >
                            {creating ? '…' : 'Create'}
                        </button>
                    </div>
                )}

                {/* Roles List */}
                <div className="flex flex-col gap-2 overflow-y-auto">
                    {roles.length === 0 && (
                        <div className="text-center text-slate-400 text-xs font-semibold py-6">
                            No roles found.<br />Restart the server to seed defaults.
                        </div>
                    )}
                    {roles.map(role => {
                        const isSelected = selectedRoleId === role.id;
                        const isSys = isSystemRole(role);
                        return (
                            <div
                                key={role.id}
                                onClick={() => handleSelectRole(role)}
                                className={`group flex items-center justify-between gap-3 p-4 rounded-2xl cursor-pointer transition-all border ${
                                    isSelected
                                        ? 'bg-secondary text-white border-secondary shadow-lg shadow-secondary/20'
                                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-100'
                                }`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                        isSelected ? 'bg-white/20' : 'bg-white border border-slate-200'
                                    }`}>
                                        {isSys ? (
                                            <Lock size={14} className={isSelected ? 'text-white' : 'text-slate-400'} />
                                        ) : (
                                            <Shield size={14} className={isSelected ? 'text-white' : 'text-secondary'} />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className={`text-xs font-black truncate ${isSelected ? 'text-white' : 'text-slate-800'}`}>{role.name}</p>
                                        <p className={`text-[10px] font-semibold ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>
                                            {isSys ? 'System Role' : 'Custom Role'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    {!isSys && (
                                        <button
                                            onClick={e => { e.stopPropagation(); setConfirmDelete(role); }}
                                            className={`w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all ${
                                                isSelected ? 'hover:bg-white/20 text-white' : 'hover:bg-rose-50 text-rose-400'
                                            }`}
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    )}
                                    <ChevronRight size={14} className={isSelected ? 'text-white/60' : 'text-slate-300'} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ─── Right Panel: Permission Matrix ───────────────────────────── */}
            <div className="flex-1 min-w-0">
                {!selectedRole ? (
                    <div className="h-full flex flex-col items-center justify-center text-center gap-4 opacity-40">
                        <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center">
                            <Shield size={32} className="text-slate-400" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-slate-600 uppercase tracking-wider">Select a Role</p>
                            <p className="text-xs text-slate-400 mt-1">Choose a role on the left to configure its permissions.</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-5">
                        {/* Role header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-black text-slate-800 tracking-tight">{selectedRole.name}</h3>
                                <p className="text-xs text-slate-400 font-semibold mt-0.5">
                                    {isSystemRole(selectedRole)
                                        ? 'System role — permissions override recommended for custom roles'
                                        : 'Custom role — configure module access below'}
                                </p>
                            </div>
                            <button
                                onClick={handleSave}
                                disabled={!permsDirty || saving}
                                className="flex items-center gap-2 px-5 py-2.5 bg-secondary text-white text-xs font-black uppercase tracking-widest rounded-xl disabled:opacity-40 active:scale-95 transition-all shadow-lg shadow-secondary/20"
                            >
                                <Save size={14} />
                                {saving ? 'Saving…' : 'Save Permissions'}
                            </button>
                        </div>

                        {/* Admin notice */}
                        {selectedRole.name.toLowerCase() === 'admin' && (
                            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                                <AlertTriangle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-amber-700 font-semibold">
                                    The <strong>Admin</strong> role always has full access regardless of checkbox states. Modifying these serves as a reference template only.
                                </p>
                            </div>
                        )}

                        {/* Permission module grid */}
                        <div className="grid gap-4">
                            {PERMISSION_MODULES.map(module => {
                                const moduleKeys = module.keys.map(k => k.key);
                                const allChecked = moduleKeys.every(k => localPerms[k]);
                                const noneChecked = moduleKeys.every(k => !localPerms[k]);

                                return (
                                    <div key={module.label} className="glass-card p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">{module.icon}</span>
                                                <h4 className="text-xs font-black text-slate-700 uppercase tracking-[0.15em]">{module.label}</h4>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleSelectAll(moduleKeys, true)}
                                                    disabled={allChecked}
                                                    className="text-[10px] font-black uppercase tracking-wider text-secondary hover:underline disabled:opacity-30 disabled:no-underline"
                                                >
                                                    All
                                                </button>
                                                <span className="text-slate-300 text-xs">|</span>
                                                <button
                                                    onClick={() => handleSelectAll(moduleKeys, false)}
                                                    disabled={noneChecked}
                                                    className="text-[10px] font-black uppercase tracking-wider text-rose-400 hover:underline disabled:opacity-30 disabled:no-underline"
                                                >
                                                    None
                                                </button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {module.keys.map(({ key, label }) => {
                                                const checked = !!localPerms[key];
                                                return (
                                                    <label
                                                        key={key}
                                                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                                                            checked
                                                                ? 'bg-secondary/5 border-secondary/30'
                                                                : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                                                        }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            onChange={() => handleToggle(key)}
                                                            className="w-4 h-4 accent-secondary cursor-pointer rounded"
                                                        />
                                                        <span className={`text-xs font-bold leading-tight ${checked ? 'text-secondary' : 'text-slate-600'}`}>
                                                            {label}
                                                        </span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* ─── Delete Confirm Modal ────────────────────────────────────── */}
            {confirmDelete && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full">
                        <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mb-5 mx-auto">
                            <Trash2 size={24} className="text-rose-500" />
                        </div>
                        <h3 className="text-lg font-black text-slate-800 text-center mb-2">Delete Role?</h3>
                        <p className="text-sm text-slate-500 text-center mb-6">
                            Are you sure you want to delete the <strong>{confirmDelete.name}</strong> role? This cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmDelete(null)}
                                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-widest rounded-2xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteRole(confirmDelete)}
                                className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-rose-500/20"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RolePermissionSettings;
