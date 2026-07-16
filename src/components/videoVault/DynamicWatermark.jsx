import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const DynamicWatermark = ({ userEmail, userIP }) => {
    const [position, setPosition] = useState({ x: 50, y: 50 });
    const [currentDate] = useState(new Date().toLocaleDateString());

    // Move watermark randomly every 7 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            const newX = Math.random() * 60 + 10; // 10% to 70% of screen width
            const newY = Math.random() * 60 + 10; // 10% to 70% of screen height
            setPosition({ x: newX, y: newY });
        }, 7000);

        return () => clearInterval(interval);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ 
                opacity: 0.15,
                left: `${position.x}%`,
                top: `${position.y}%`
            }}
            transition={{ 
                opacity: { duration: 0.5 },
                left: { duration: 1.5, ease: "easeInOut" },
                top: { duration: 1.5, ease: "easeInOut" }
            }}
            className="absolute pointer-events-none select-none z-50"
            style={{
                transform: 'translate(-50%, -50%) rotate(-30deg)',
            }}
        >
            <div className="text-white text-sm md:text-base font-semibold tracking-wider whitespace-nowrap">
                {userEmail} | {userIP} | {currentDate}
            </div>
        </motion.div>
    );
};

export default DynamicWatermark;
