import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Shield, Users, Eye, AlertTriangle, CheckCircle, XCircle, 
    Loader2, Play, Plus, Edit2, Trash2, Search, Filter,
    UserCheck, Clock, BarChart3, Video, FolderPlus
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useApp } from '../context/AppContext';
import io from 'socket.io-client';
import Modal from '../components/layout/Modal';

const API_URL = 'http://localhost:5001/api/video-vault';

const VideoVaultAdmin = () => {
    const { token, user } = useApp();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState(null);
    const [recordings, setRecordings] = useState([]);
    const [accessRequests, setAccessRequests] = useState([]);
    const [viewLogs, setViewLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [socket, setSocket] = useState(null);
    
    // New recording form
    const [newRecording, setNewRecording] = useState({
        title: '',
        description: '',
        courseId: '',
        batchId: '',
        googleDriveFileId: '',
        duration: '',
        thumbnailUrl: ''
    });

    // Initialize Socket.io for real-time updates
    useEffect(() => {
        const socketInstance = io('http://localhost:5001');
        setSocket(socketInstance);

        socketInstance.on('video-access-request', (data) => {
            toast.success('New video access request received!');
            fetchAccessRequests();
        });

        return () => {
            socketInstance.disconnect();
        };
    }, []);

    // Fetch all data on mount
    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchStats(),
                fetchRecordings(),
                fetchAccessRequests(),
                fetchViewLogs()
            ]);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        const response = await axios.get(`${API_URL}/admin/stats`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setStats(response.data);
    };

    const fetchRecordings = async () => {
        const response = await axios.get(`${API_URL}/admin/recordings`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setRecordings(response.data.recordings || []);
    };

    const fetchAccessRequests = async () => {
        const response = await axios.get(`${API_URL}/admin/access-requests`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setAccessRequests(response.data.requests || []);
    };

    const fetchViewLogs = async () => {
        const response = await axios.get(`${API_URL}/admin/view-logs?isSuspicious=true&limit=20`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setViewLogs(response.data.logs || []);
    };

    // Create new recording
    const handleCreateRecording = async (e) => {
        e.preventDefault();
        try {
            await axios.post(
                `${API_URL}/admin/recordings`,
                { ...newRecording, isApproved: true },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Recording created successfully');
            setShowCreateModal(false);
            setNewRecording({
                title: '',
                description: '',
                courseId: '',
                batchId: '',
                googleDriveFileId: '',
                duration: '',
                thumbnailUrl: ''
            });
            fetchRecordings();
        } catch (error) {
            toast.error('Failed to create recording');
        }
    };

    // Approve access request
    const handleApproveRequest = async (requestId) => {
        try {
            await axios.post(
                `${API_URL}/admin/access-requests/${requestId}/approve`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Access request approved');
            fetchAccessRequests();
        } catch (error) {
            toast.error('Failed to approve request');
        }
    };

    // Reject access request
    const handleRejectRequest = async (requestId) => {
        try {
            await axios.post(
                `${API_URL}/admin/access-requests/${requestId}/reject`,
                { reason: 'Access denied by admin' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Access request rejected');
            fetchAccessRequests();
        } catch (error) {
            toast.error('Failed to reject request');
        }
    };

    // Delete recording
    const handleDeleteRecording = async (recordingId) => {
        if (!window.confirm('Are you sure you want to delete this recording?')) return;
        
        try {
            await axios.delete(`${API_URL}/admin/recordings/${recordingId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Recording deleted');
            fetchRecordings();
        } catch (error) {
            toast.error('Failed to delete recording');
        }
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    if (loading && !stats) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
                <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                        <Shield className="w-10 h-10 text-blue-500" />
                        Video Vault - Admin Center
                    </h1>
                    <p className="text-gray-400">Manage recordings, access requests, and security logs</p>
                </motion.div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
                    >
                        <Video className="w-10 h-10 text-blue-400 mb-3" />
                        <p className="text-3xl font-bold text-white">{stats?.totalRecordings || 0}</p>
                        <p className="text-gray-400 text-sm">Total Recordings</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
                    >
                        <Clock className="w-10 h-10 text-yellow-400 mb-3" />
                        <p className="text-3xl font-bold text-white">{stats?.pendingRequests || 0}</p>
                        <p className="text-gray-400 text-sm">Pending Requests</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
                    >
                        <Eye className="w-10 h-10 text-green-400 mb-3" />
                        <p className="text-3xl font-bold text-white">{stats?.totalViews || 0}</p>
                        <p className="text-gray-400 text-sm">Total Views</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
                    >
                        <AlertTriangle className="w-10 h-10 text-red-400 mb-3" />
                        <p className="text-3xl font-bold text-white">{stats?.suspiciousActivities || 0}</p>
                        <p className="text-gray-400 text-sm">Suspicious Activities</p>
                    </motion.div>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-6 border-b border-white/10 pb-4">
                    {['dashboard', 'recordings', 'requests', 'logs'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                                activeTab === tab 
                                    ? 'bg-blue-600 text-white' 
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    {/* Recordings Tab */}
                    {activeTab === 'recordings' && (
                        <motion.div
                            key="recordings"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-white">Recordings Library</h2>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all hover:scale-105"
                                >
                                    <FolderPlus className="w-5 h-5" />
                                    <span>Add Recording</span>
                                </button>
                            </div>

                            <div className="space-y-4">
                                {recordings.map((recording) => (
                                    <div
                                        key={recording.id}
                                        className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h3 className="text-xl font-semibold text-white mb-2">
                                                    {recording.title}
                                                </h3>
                                                <p className="text-gray-400 text-sm mb-3">{recording.description}</p>
                                                <div className="flex gap-6 text-sm text-gray-400">
                                                    <span>Course: {recording.Course?.name}</span>
                                                    <span>Duration: {recording.duration}</span>
                                                    <span>Views: {recording.viewCount}</span>
                                                    <span>Added: {formatDate(recording.createdAt)}</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteRecording(recording.id)}
                                                className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Access Requests Tab */}
                    {activeTab === 'requests' && (
                        <motion.div
                            key="requests"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <h2 className="text-2xl font-bold text-white mb-6">Live Access Requests</h2>
                            
                            <div className="space-y-4">
                                {accessRequests.filter(r => r.status === 'Pending').map((request) => (
                                    <div
                                        key={request.id}
                                        className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h3 className="text-lg font-semibold text-white mb-2">
                                                    {request.Student?.name}
                                                </h3>
                                                <p className="text-gray-400 text-sm">{request.Student?.email}</p>
                                                <p className="text-blue-400 text-sm mt-2">
                                                    Requesting: {request.VideoRecording?.title}
                                                </p>
                                                <p className="text-gray-500 text-xs mt-1">
                                                    {formatDate(request.createdAt)}
                                                </p>
                                            </div>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => handleApproveRequest(request.id)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                                                >
                                                    <CheckCircle className="w-5 h-5" />
                                                    <span>Approve</span>
                                                </button>
                                                <button
                                                    onClick={() => handleRejectRequest(request.id)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                                                >
                                                    <XCircle className="w-5 h-5" />
                                                    <span>Reject</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {accessRequests.filter(r => r.status === 'Pending').length === 0 && (
                                    <div className="text-center py-20">
                                        <UserCheck className="w-20 h-20 text-gray-600 mx-auto mb-4" />
                                        <p className="text-gray-400 text-lg">No pending requests</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* Security Logs Tab */}
                    {activeTab === 'logs' && (
                        <motion.div
                            key="logs"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                <AlertTriangle className="w-8 h-8 text-red-500" />
                                Suspicious Activity Logs
                            </h2>
                            
                            <div className="space-y-4">
                                {viewLogs.map((log) => (
                                    <div
                                        key={log.id}
                                        className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-red-500/30"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-lg font-semibold text-white mb-2">
                                                    {log.Student?.name} ({log.Student?.customId})
                                                </h3>
                                                <div className="space-y-2 text-sm text-gray-400">
                                                    <p><span className="text-gray-300">Email:</span> {log.Student?.email}</p>
                                                    <p><span className="text-gray-300">IP Address:</span> {log.ipAddress}</p>
                                                    <p><span className="text-gray-300">Browser:</span> {log.browserInfo}</p>
                                                    <p><span className="text-gray-300">OS:</span> {log.osInfo}</p>
                                                    <p><span className="text-gray-300">Device:</span> {log.deviceInfo}</p>
                                                    <p><span className="text-gray-300">Video:</span> {log.VideoRecording?.title}</p>
                                                    <p><span className="text-gray-300">Time:</span> {formatDate(log.sessionStartedAt)}</p>
                                                    <p className="text-red-400 font-semibold mt-2">
                                                        Suspicious: {log.suspiciousReason}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {viewLogs.length === 0 && (
                                    <div className="text-center py-20">
                                        <Shield className="w-20 h-20 text-green-600 mx-auto mb-4" />
                                        <p className="text-gray-400 text-lg">No suspicious activities detected</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Create Recording Modal */}
                <Modal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    title="Add New Recording"
                    maxWidth="max-w-2xl"
                >
                    <form onSubmit={handleCreateRecording} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Title *</label>
                            <input
                                type="text"
                                value={newRecording.title}
                                onChange={(e) => setNewRecording({...newRecording, title: e.target.value})}
                                className="input-field"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Description</label>
                            <textarea
                                value={newRecording.description}
                                onChange={(e) => setNewRecording({...newRecording, description: e.target.value})}
                                className="input-field"
                                rows="3"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Course ID *</label>
                                <input
                                    type="number"
                                    value={newRecording.courseId}
                                    onChange={(e) => setNewRecording({...newRecording, courseId: e.target.value})}
                                    className="input-field"
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Batch ID</label>
                                <input
                                    type="number"
                                    value={newRecording.batchId}
                                    onChange={(e) => setNewRecording({...newRecording, batchId: e.target.value})}
                                    className="input-field"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Google Drive File ID *</label>
                            <input
                                type="text"
                                value={newRecording.googleDriveFileId}
                                onChange={(e) => setNewRecording({...newRecording, googleDriveFileId: e.target.value})}
                                className="input-field"
                                placeholder="Enter Google Drive file ID"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Duration</label>
                                <input
                                    type="text"
                                    value={newRecording.duration}
                                    onChange={(e) => setNewRecording({...newRecording, duration: e.target.value})}
                                    className="input-field"
                                    placeholder="e.g., 1:30:00"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Thumbnail URL</label>
                                <input
                                    type="text"
                                    value={newRecording.thumbnailUrl}
                                    onChange={(e) => setNewRecording({...newRecording, thumbnailUrl: e.target.value})}
                                    className="input-field"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="btn-secondary w-full py-4 font-black uppercase tracking-wider mt-4"
                        >
                            Create Recording
                        </button>
                    </form>
                </Modal>
            </div>
        </div>
    );
};

export default VideoVaultAdmin;
