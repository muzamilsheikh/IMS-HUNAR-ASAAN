import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward, Loader2, AlertTriangle } from 'lucide-react';
import DynamicWatermark from './DynamicWatermark';
import axios from 'axios';

const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5001/api/video-vault'
    : '/api/video-vault';

const CustomVideoPlayer = ({ recording, user, sessionId, sessionToken, onSessionEnd }) => {
    const videoRef = useRef(null);
    const playerContainerRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [watchTime, setWatchTime] = useState(0);
    const controlsTimeoutRef = useRef(null);

    // Get secure stream URL
    const streamUrl = `${API_URL}/stream/${recording.id}/session/${sessionId}`;

    // Track watch time
    useEffect(() => {
        let interval;
        if (isPlaying) {
            interval = setInterval(() => {
                setWatchTime(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isPlaying]);

    // Auto-hide controls
    const handleMouseMove = () => {
        setShowControls(true);
        clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => {
            if (isPlaying) setShowControls(false);
        }, 3000);
    };

    // Toggle play/pause
    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    // Time update handler
    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    // Duration loaded
    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
            setIsLoading(false);
        }
    };

    // Seek handler
    const handleSeek = (e) => {
        const seekTime = (e.target.value / 100) * duration;
        if (videoRef.current) {
            videoRef.current.currentTime = seekTime;
            setCurrentTime(seekTime);
        }
    };

    // Volume handler
    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (videoRef.current) {
            videoRef.current.volume = newVolume;
            setIsMuted(newVolume === 0);
        }
    };

    // Toggle mute
    const toggleMute = () => {
        if (videoRef.current) {
            if (isMuted) {
                videoRef.current.volume = volume;
                setIsMuted(false);
            } else {
                videoRef.current.volume = 0;
                setIsMuted(true);
            }
        }
    };

    // Skip forward/backward
    const skip = (seconds) => {
        if (videoRef.current) {
            videoRef.current.currentTime += seconds;
        }
    };

    // Toggle fullscreen
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            playerContainerRef.current?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    // Format time
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Handle video end
    const handleVideoEnd = async () => {
        setIsPlaying(false);
        // End session and send watch time
        try {
            await axios.post(
                `${API_URL}/stream/session/${sessionId}/end`,
                { watchTime },
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                }
            );
            if (onSessionEnd) onSessionEnd();
        } catch (error) {
            console.error('Failed to end session:', error);
        }
    };

    // Handle errors
    const handleError = () => {
        setIsLoading(false);
        setError('Failed to load video. Please try again.');
    };

    return (
        <div 
            ref={playerContainerRef}
            className="relative w-full bg-black rounded-lg overflow-hidden shadow-2xl"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => isPlaying && setShowControls(false)}
        >
            {/* Video Element */}
            <video
                ref={videoRef}
                className="w-full h-auto"
                src={streamUrl}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleVideoEnd}
                onError={handleError}
                onClick={togglePlay}
                controls={false}
                playsInline
            />

            {/* Dynamic Watermark */}
            {isPlaying && (
                <DynamicWatermark 
                    userEmail={user.email} 
                    userIP={user.ip || 'Unknown IP'} 
                />
            )}

            {/* Loading Overlay */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center bg-black/50"
                    >
                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error Overlay */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 flex items-center justify-center bg-black/80"
                    >
                        <div className="text-center text-white">
                            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
                            <p className="text-lg font-semibold">{error}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Custom Controls */}
            <AnimatePresence>
                {showControls && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4"
                    >
                        {/* Progress Bar */}
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={duration ? (currentTime / duration) * 100 : 0}
                            onChange={handleSeek}
                            className="w-full h-2 bg-gray-600 rounded-full cursor-pointer mb-4 accent-blue-500"
                        />

                        {/* Controls Row */}
                        <div className="flex items-center justify-between text-white">
                            <div className="flex items-center gap-4">
                                <button onClick={() => skip(-10)} className="hover:text-blue-400 transition">
                                    <SkipBack className="w-6 h-6" />
                                </button>
                                
                                <button onClick={togglePlay} className="hover:text-blue-400 transition">
                                    {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
                                </button>
                                
                                <button onClick={() => skip(10)} className="hover:text-blue-400 transition">
                                    <SkipForward className="w-6 h-6" />
                                </button>

                                <div className="flex items-center gap-2">
                                    <button onClick={toggleMute} className="hover:text-blue-400 transition">
                                        {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                                    </button>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={isMuted ? 0 : volume}
                                        onChange={handleVolumeChange}
                                        className="w-24 h-1 bg-gray-600 rounded-full cursor-pointer accent-blue-500"
                                    />
                                </div>

                                <span className="text-sm font-mono">
                                    {formatTime(currentTime)} / {formatTime(duration)}
                                </span>
                            </div>

                            <button onClick={toggleFullscreen} className="hover:text-blue-400 transition">
                                {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CustomVideoPlayer;
