import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

const Modal = ({ 
    isOpen, 
    onClose, 
    title, 
    children, 
    className,
    maxWidth = 'max-w-md' // e.g. max-w-md, max-w-lg, max-w-2xl
}) => {
    // Escape key press handler
    useEffect(() => {
        const handleKeyDown = (e) => { 
            if (e.key === 'Escape') onClose(); 
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }} 
                animate={{ scale: 1, opacity: 1, y: 0 }} 
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
                className={cn(
                    "w-full bg-white rounded-[2rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]",
                    maxWidth,
                    className
                )}
            >
                {/* Sticky Header */}
                <div className="sticky top-0 bg-white z-10 px-8 pt-8 pb-4 border-b border-slate-50 flex items-center justify-between">
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                        {title}
                    </h3>
                    <button 
                        onClick={onClose} 
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors cursor-pointer"
                        aria-label="Close modal"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Scrollable Content Container */}
                <div className="flex-1 overflow-y-auto px-8 py-6 standard-scrollbar">
                    {children}
                </div>
            </motion.div>
        </div>
    );
};

export default Modal;
