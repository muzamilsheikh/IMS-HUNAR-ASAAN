import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Play, Lock, Clock, Calendar, User, AlertCircle, 
    ChevronRight, FolderOpen, ArrowLeft, Loader2
} from 'lucide-react';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import CustomVideoPlayer from '../components/videoVault/CustomVideoPlayer';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:5001/api/video-vault';

const VideoVault = () => {
    const { user, token } = useApp();
    const [view, setView] = useState('folders'); // 'folders', 'videos', 'player'
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [selectedRecording, setSelectedRecording] = useState(null);
    const [recordings, setRecordings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sessionId, setSessionId] = useState(null);
    const [sessionToken, setSessionToken] = useState(null);

    // Fetch recordings for student's course/batch
    useEffect(() => {
        fetchRecordings();
    }, []);

    const fetchRecordings = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/student/recordings`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRecordings(response.data.recordings || []);
        } catch (error) {
            console.error('Failed to fetch recordings:', error);
            toast.error('Failed to load video recordings');
        } finally {
            setLoading(false);
        }
    };

    // Group recordings by course
    const recordingsByCourse = recordings.reduce((acc, recording) => {
        const courseId = recording.courseId || 'uncategorized';
        const courseName = recording.Course?.name || 'Uncategorized';
        if (!acc[courseId]) {
            acc[courseId] = { name: courseName, recordings: [] };
        }
        acc[courseId].recordings.push(recording);
        return acc;
    }, {});

    // Request access to recording
    const requestAccess = async (recordingId) => {
        try {
            await axios.post(
                `${API_URL}/student/request-access/${recordingId}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Access request sent to admin');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to request access');
        }
    };

    // Initialize streaming session
    const initializeStream = async (recording) => {
        try {
            const response = await axios.post(
                `${API_URL}/stream/initialize/${recording.id}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSessionId(response.data.sessionId);
            setSessionToken(response.data.sessionToken);
            setSelectedRecording(recording);
            setView('player');
            toast.success('Video session started');
        } catch (error) {
            if (error.response?.data?.requiresAccessRequest) {
                toast.error('Please request access to watch this video');
            } else {
                toast.error('Failed to start video session');
            }
        }
    };

    // Handle session end
    const handleSessionEnd = () => {
        setSessionId(null);
        setSessionToken(null);
        setView('videos');
        toast.success('Session ended. Watch time recorded.');
    };

    // Back navigation
    const goBack = () => {
        if (view === 'player') {
            setView('videos');
        } else if (view === 'videos') {
            setView('folders');
            setSelectedCourse(null);
        }
    };

    // Student user info for watermark
    const userWatermark = {
        email: user?.email || 'Unknown',
        ip: user?.ip || null // IP will be determined by backend
    };

    if (loading) {
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
                    <h1 className="text-4xl font-bold text-white mb-2">
                        🎬 Video Vault
                    </h1>
                    <p className="text-gray-400">Access your course recordings securely</p>
                </motion.div>

                {/* Navigation Breadcrumb */}
                {view !== 'folders' && (
                    <motion.button
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={goBack}
                        className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6 transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back</span>
                    </motion.button>
                )}

                {/* Folders View */}
                {view === 'folders' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Object.entries(recordingsByCourse).map(([courseId, data]) => (
                            <motion.div
                                key={courseId}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.02 }}
                                onClick={() => {
                                    setSelectedCourse({ id: courseId, name: data.name });
                                    setView('videos');
                                }}
                                className="bg-white/10 backdrop-blur-lg rounded-xl p-6 cursor-pointer border border-white/20 hover:border-blue-500/50 transition-all"
                            >
                                <FolderOpen className="w-12 h-12 text-blue-400 mb-4" />
                                <h3 className="text-xl font-semibold text-white mb-2">{data.name}</h3>
                                <p className="text-gray-400 text-sm">
                                    {data.recordings.length} video{data.recordings.length !== 1 ? 's' : ''}
                                </p>
                            </motion.div>
                        ))}

                        {Object.keys(recordingsByCourse).length === 0 && (
                            <div className="col-span-full text-center py-20">
                                <AlertCircle className="w-20 h-20 text-gray-600 mx-auto mb-4" />
                                <p className="text-gray-400 text-lg">No recordings available yet</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Videos List View */}
                {view === 'videos' && selectedCourse && (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-white mb-6">
                            {selectedCourse.name} - Recordings
                        </h2>
                        {recordingsByCourse[selectedCourse.id]?.recordings.map((recording, index) => (
                            <motion.div
                                key={recording.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-blue-500/50 transition-all"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-semibold text-white mb-2">
                                            {recording.title}
                                        </h3>
                                        {recording.description && (
                                            <p className="text-gray-400 text-sm mb-3">{recording.description}</p>
                                        )}
                                        <div className="flex items-center gap-6 text-sm text-gray-400">
                                            {recording.duration && (
                                                <span className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4" />
                                                    {recording.duration}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                {new Date(recording.createdAt).toLocaleDateString()}
                                            </span>
                                            {recording.viewCount > 0 && (
                                                <span className="flex items-center gap-2">
                                                    <User className="w-4 h-4" />
                                                    {recording.viewCount} views
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => initializeStream(recording)}
                                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all hover:scale-105"
                                    >
                                        <Play className="w-5 h-5" />
                                        <span>Watch</span>
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Video Player View */}
                {view === 'player' && selectedRecording && sessionId && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-6"
                    >
                        <h2 className="text-2xl font-bold text-white mb-4">
                            {selectedRecording.title}
                        </h2>
                        <CustomVideoPlayer
                            recording={selectedRecording}
                            user={userWatermark}
                            sessionId={sessionId}
                            sessionToken={sessionToken}
                            onSessionEnd={handleSessionEnd}
                        />
                        {selectedRecording.description && (
                            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
                                <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                                <p className="text-gray-400">{selectedRecording.description}</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default VideoVault;
