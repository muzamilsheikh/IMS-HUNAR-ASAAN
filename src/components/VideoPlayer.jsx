import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../utils/api';

/**
 * VideoPlayer
 *
 * A secure video player with a floating, randomly-repositioned watermark that
 * displays the viewer's email and IP address. Right-click is disabled on the
 * video element to deter easy downloading.
 *
 * Props:
 *   recordingId  {string}  — UUID of the VideoRecording (used to build the stream URL)
 *
 * Watermark behaviour:
 *   - Positioned randomly within a 5-75% range for both top and left.
 *   - Moves every 30 seconds (CSS transition makes it glide smoothly).
 *   - Shows "email | ip" in semi-transparent white monospace text.
 */
const VideoPlayer = ({ recordingId }) => {
    const [watermarkPos, setWatermarkPos] = useState({ top: 10, left: 10 });
    const [userInfo,     setUserInfo]     = useState({ email: '', ip: '' });
    const intervalRef = useRef(null);

    // ── On mount: fetch current user info + start watermark interval ──────────
    useEffect(() => {
        // 1. Fetch authenticated user (email) + their IP from the /me endpoint.
        //    We read IP from the response if the backend includes it; otherwise
        //    we fall back to a lightweight ipify call.
        const fetchUserInfo = async () => {
            try {
                // apiClient.getUserInfo() → { user: { id, name, email, role } }
                const data = await apiClient.getUserInfo();
                const email = data?.user?.email || '';

                // Attempt to get client IP from a public service (best-effort)
                let ip = '';
                try {
                    const ipRes = await fetch('https://api.ipify.org?format=json');
                    const ipData = await ipRes.json();
                    ip = ipData?.ip || '';
                } catch {
                    ip = 'N/A';
                }

                setUserInfo({ email, ip });
            } catch {
                // If auth fails, still show the player — watermark is empty
                setUserInfo({ email: '', ip: '' });
            }
        };

        fetchUserInfo();

        // 2. Move watermark every 30 seconds
        const randomPos = () => ({
            top:  Math.floor(Math.random() * 70) + 5,
            left: Math.floor(Math.random() * 70) + 5
        });

        intervalRef.current = setInterval(() => {
            setWatermarkPos(randomPos());
        }, 30000);

        // 3. Cleanup on unmount
        return () => {
            clearInterval(intervalRef.current);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Watermark label ───────────────────────────────────────────────────────
    const watermarkLabel = userInfo.email
        ? `${userInfo.email} | ${userInfo.ip}`
        : userInfo.ip || '';

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div style={{ position: 'relative', width: '100%', background: '#000' }}>

            <video
                src={`/api/recordings/stream/${recordingId}`}
                controls
                style={{ width: '100%', display: 'block' }}
                onContextMenu={(e) => e.preventDefault()}
                controlsList="nodownload"
            />

            {/* Floating semi-transparent watermark */}
            <div
                style={{
                    position:      'absolute',
                    top:           `${watermarkPos.top}%`,
                    left:          `${watermarkPos.left}%`,
                    color:         'rgba(255,255,255,0.3)',
                    fontSize:      '12px',
                    pointerEvents: 'none',
                    zIndex:        10,
                    userSelect:    'none',
                    fontFamily:    'monospace',
                    textShadow:    '1px 1px 4px rgba(0,0,0,0.9)',
                    whiteSpace:    'nowrap',
                    transition:    'top 2s ease, left 2s ease'
                }}
            >
                {watermarkLabel}
            </div>

        </div>
    );
};

export default VideoPlayer;
