import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
    Plus,
    Search,
    Users as UsersIcon,
    Shield,
    ShieldCheck,
    ShieldAlert,
    Eye,
    EyeOff,
    Key,
    Filter,
    X,
    CheckCircle2,
    XCircle,
    UserPlus,
    ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import toast from 'react-hot-toast';
import apiClient from '../utils/api';
import Modal from '../components/layout/Modal';

const Users = () => {
    const { user: currentUser } = useApp();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showPasswordReset, setShowPasswordReset] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    const [filters, setFilters] = useState({
        search: '',
        role: '',
        status: ''
    });

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'Staff',
        password: '',
        specialty: '',
        associatedCourses: []
    });

    const [userType, setUserType] = useState('Staff');
    const [courses, setCourses] = useState([]);
    const [isOpenCourses, setIsOpenCourses] = useState(false);

    const [passwordData, setPasswordData] = useState({
        newPassword: '',
        autoGenerate: true
    });
    const [showPassword, setShowPassword] = useState(false);

    // Fetch users
    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await apiClient.getUsers();
            setUsers(response.users || []);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const fetchCourses = async () => {
        try {
            const data = await apiClient.getCourses();
            setCourses(data || []);
        } catch (error) {
            console.error('Failed to fetch courses:', error);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchCourses();
    }, []);

    // Create new user
    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            const response = await apiClient.createUser(formData);
            toast.success('User created successfully!');
            if (response.temporaryPassword) {
                toast.success(`Temporary password: ${response.temporaryPassword}`, { duration: 10000 });
            }
            setShowCreateForm(false);
            setFormData({ name: '', email: '', role: 'Staff', password: '', specialty: '', associatedCourses: [] });
            setUserType('Staff');
            setIsOpenCourses(false);
            fetchUsers();
        } catch (error) {
            console.error('Failed to create user:', error);
            toast.error(error.response?.data?.error || 'Failed to create user');
        }
    };

    // Toggle user status
    const handleToggleStatus = async (user) => {
        try {
            const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
            await apiClient.updateUserStatus(user.id, { status: newStatus });
            toast.success(`User ${newStatus.toLowerCase()} successfully`);
            fetchUsers();
        } catch (error) {
            console.error('Failed to update user status:', error);
            toast.error('Failed to update user status');
        }
    };

    // Reset password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!passwordData.newPassword || passwordData.newPassword.trim().length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }
        try {
            await apiClient.resetUserPassword(selectedUser.id, { newPassword: passwordData.newPassword });
            toast.success(`Password for ${selectedUser.name} reset successfully!`);
            setShowPasswordReset(false);
            setSelectedUser(null);
            setPasswordData({ newPassword: '', autoGenerate: true });
            setShowPassword(false);
        } catch (error) {
            console.error('Failed to reset password:', error);
            toast.error(error.response?.data?.error || 'Failed to reset password');
        }
    };

    // Filter users
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(filters.search.toLowerCase()) ||
            user.email.toLowerCase().includes(filters.search.toLowerCase());

        const matchesRole = filters.role ? user.role === filters.role : true;
        const matchesStatus = filters.status ? user.status === filters.status : true;

        return matchesSearch && matchesRole && matchesStatus;
    });

    // Get role icon
    const getRoleIcon = (role) => {
        switch (role) {
            case 'Admin':
                return <ShieldCheck size={16} className="text-red-500" />;
            case 'Manager':
                return <Shield size={16} className="text-blue-500" />;
            case 'Ads Manager':
                return <ShieldAlert size={16} className="text-orange-500" />;
            case 'Staff':
                return <UsersIcon size={16} className="text-green-500" />;
            case 'Student':
                return <UserPlus size={16} className="text-purple-500" />;
            default:
                return <UsersIcon size={16} className="text-gray-500" />;
        }
    };

    // Get status color
    const getStatusColor = (status) => {
        return status === 'Active' ? 'text-green-500' : 'text-red-500';
    };

    if (loading) {
        return (
            <div className="h-[80vh] flex items-center justify-center font-black text-slate-300 animate-pulse uppercase tracking-[0.5em]">
                Loading Users...
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-in fade-in duration-500 pb-20 pt-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                        <span className="text-[10px] font-black text-secondary uppercase tracking-[0.4em]">User Management System</span>
                    </div>
                    <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-800 tracking-tighter">User Directory</h2>
                    <p className="text-slate-400 mt-2 font-black uppercase text-[10px] tracking-widest italic opacity-60">Manage staff accounts, roles, and access permissions.</p>
                </div>
                <button
                    onClick={() => setShowCreateForm(true)}
                    className="btn-secondary py-4 sm:py-5 px-6 sm:px-10 flex items-center gap-2 sm:gap-3 shadow-2xl shadow-secondary/40 active:scale-95 transition-all w-full sm:w-auto justify-center"
                >
                    <Plus size={20} className="sm:size-24" />
                    <span className="font-black tracking-tight text-base sm:text-lg">Create User</span>
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass-card p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Users</p>
                            <p className="text-3xl font-black text-slate-800">{users.length}</p>
                        </div>
                        <UsersIcon size={24} className="text-secondary" />
                    </div>
                </div>
                <div className="glass-card p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Staff Members</p>
                            <p className="text-3xl font-black text-slate-800">{users.filter(u => u.role !== 'Student').length}</p>
                        </div>
                        <Shield size={24} className="text-blue-500" />
                    </div>
                </div>
                <div className="glass-card p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Students</p>
                            <p className="text-3xl font-black text-slate-800">{users.filter(u => u.role === 'Student').length}</p>
                        </div>
                        <UserPlus size={24} className="text-purple-500" />
                    </div>
                </div>
                <div className="glass-card p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Users</p>
                            <p className="text-3xl font-black text-slate-800">{users.filter(u => u.status === 'Active').length}</p>
                        </div>
                        <CheckCircle2 size={24} className="text-green-500" />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="glass-card p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                className="w-full pl-10 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            />
                        </div>
                    </div>
                    <select
                        className="px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
                        value={filters.role}
                        onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                    >
                        <option value="">All Roles</option>
                        <option value="Admin">Admin</option>
                        <option value="Manager">Manager</option>
                        <option value="Ads Manager">Ads Manager</option>
                        <option value="Staff">Staff</option>
                        <option value="Student">Student</option>
                    </select>
                    <select
                        className="px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    >
                        <option value="">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                </div>
            </div>

            {/* Users Table */}
            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">User</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Created</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-black text-slate-800">{user.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {getRoleIcon(user.role)}
                                            <span className="text-sm font-bold text-slate-600">{user.role}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {user.status === 'Active' ? (
                                                <CheckCircle2 size={16} className="text-green-500" />
                                            ) : (
                                                <XCircle size={16} className="text-red-500" />
                                            )}
                                            <span className={cn("text-sm font-bold", getStatusColor(user.status))}>
                                                {user.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-bold text-slate-600">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleToggleStatus(user)}
                                                className={cn(
                                                    "p-2 rounded-lg transition-all",
                                                    user.status === 'Active'
                                                        ? "text-red-500 hover:bg-red-50"
                                                        : "text-green-500 hover:bg-green-50"
                                                )}
                                                title={user.status === 'Active' ? 'Deactivate User' : 'Activate User'}
                                            >
                                                {user.status === 'Active' ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setShowPasswordReset(true);
                                                    setShowPassword(false);
                                                }}
                                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                                title="Reset Password"
                                            >
                                                <Key size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredUsers.length === 0 && (
                    <div className="text-center py-12">
                        <UsersIcon size={48} className="text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 font-bold text-lg">No users found</p>
                        <p className="text-slate-400 mt-2">Try adjusting your filters</p>
                    </div>
                )}
            </div>

            {/* Create User Modal */}
            <AnimatePresence>
                {showCreateForm && (
                    <Modal
                        isOpen={showCreateForm}
                        onClose={() => {
                            setShowCreateForm(false);
                            setFormData({ name: '', email: '', role: 'Staff', password: '', specialty: '', associatedCourses: [] });
                            setUserType('Staff');
                            setIsOpenCourses(false);
                        }}
                        title="Create New User"
                        maxWidth="max-w-md"
                    >
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Full Name</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email Address</label>
                                <input
                                    type="email"
                                    className="input-field"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Select Role</label>
                                <select
                                    className="input-field"
                                    value={userType}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setUserType(val);
                                        setFormData(prev => ({
                                            ...prev,
                                            role: val === 'Student' ? 'Student' : 'Staff',
                                            specialty: '',
                                            associatedCourses: []
                                        }));
                                    }}
                                    required
                                >
                                    <option value="Staff">Staff</option>
                                    <option value="Student">Student</option>
                                </select>
                            </div>
                            {userType === 'Staff' && (
                                <>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Role</label>
                                        <select
                                            className="input-field"
                                            value={formData.role}
                                            onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                                            required
                                        >
                                            <option value="Staff">Staff</option>
                                            <option value="Manager">Manager</option>
                                            <option value="Ads Manager">Ads Manager</option>
                                            <option value="Admin">Admin</option>
                                            <option value="accounts_manager">Accounts Manager</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Instructor Specialty</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="e.g. Medical Billing Expert"
                                            value={formData.specialty}
                                            onChange={(e) => setFormData(prev => ({ ...prev, specialty: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Associated Courses</label>
                                        <div className="relative mt-2">
                                            <button
                                                type="button"
                                                className="w-full input-field flex items-center justify-between bg-white text-left font-bold text-slate-700 pr-4"
                                                onClick={() => setIsOpenCourses(!isOpenCourses)}
                                            >
                                                <span className="truncate">
                                                    {formData.associatedCourses.length === 0
                                                        ? 'Select Courses...'
                                                        : courses
                                                              .filter(c => formData.associatedCourses.includes(c.id))
                                                              .map(c => c.name)
                                                              .join(', ')}
                                                </span>
                                                <ChevronDown className={cn("text-slate-400 transition-transform duration-200", isOpenCourses ? "rotate-180" : "")} size={16} />
                                            </button>
                                            {isOpenCourses && (
                                                <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto p-2 space-y-1">
                                                    {courses.map(course => {
                                                        const isChecked = formData.associatedCourses.includes(course.id);
                                                        return (
                                                            <button
                                                                key={course.id}
                                                                type="button"
                                                                className={cn(
                                                                    "w-full text-left px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors",
                                                                    isChecked ? "bg-secondary/10 text-secondary" : "hover:bg-slate-50 text-slate-700"
                                                                )}
                                                                onClick={() => {
                                                                    setFormData(prev => {
                                                                        const associatedCourses = isChecked
                                                                            ? prev.associatedCourses.filter(id => id !== course.id)
                                                                            : [...prev.associatedCourses, course.id];
                                                                        return { ...prev, associatedCourses };
                                                                    });
                                                                }}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    className="rounded text-secondary focus:ring-secondary/20 h-4 w-4 border-slate-300 pointer-events-none"
                                                                    checked={isChecked}
                                                                    readOnly
                                                                />
                                                                <span>{course.name} ({course.code})</span>
                                                            </button>
                                                        );
                                                    })}
                                                    {courses.length === 0 && (
                                                        <p className="text-slate-400 text-xs italic p-2 text-center">No courses found</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Password (Optional)</label>
                                <input
                                    type="password"
                                    className="input-field"
                                    value={formData.password}
                                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                    placeholder="Leave empty to auto-generate"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">If empty, a temporary password will be generated and emailed</p>
                            </div>
                            <button type="submit" className="btn-secondary w-full py-4 font-black mt-6 uppercase tracking-wider">
                                Create User
                            </button>
                        </form>
                    </Modal>
                )}
            </AnimatePresence>

            {/* Password Reset Modal */}
            <AnimatePresence>
                {showPasswordReset && selectedUser && (
                    <Modal
                        isOpen={showPasswordReset}
                        onClose={() => {
                            setShowPasswordReset(false);
                            setSelectedUser(null);
                            setPasswordData({ newPassword: '', autoGenerate: true });
                            setShowPassword(false);
                        }}
                        title="Reset Password"
                        maxWidth="max-w-md"
                        className="bg-white/90"
                    >
                        <form onSubmit={handleResetPassword} className="space-y-5">
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 block mb-2">New Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className="input-field pr-12"
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value, autoGenerate: false }))}
                                        placeholder="Enter new password (min. 6 chars)"
                                        required
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(p => !p)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                        title={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1.5 ml-1">Must be at least 6 characters long.</p>
                            </div>
                            <button type="submit" className="btn-secondary w-full py-4 font-black uppercase tracking-wider">
                                Reset Password
                            </button>
                        </form>
                    </Modal>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Users;