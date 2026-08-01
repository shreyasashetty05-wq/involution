"use client";

import { useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import AIChat from './AIChat';
import { PlasmaBotButton } from './chat/PlasmaBotButton';
import { AnimatePresence, motion } from 'framer-motion';

export default function GlobalChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const params = useParams();
    const pathname = usePathname();
    
    // Only show on startups and incube pages
    const isAllowedPage = pathname.startsWith('/startups') || pathname.startsWith('/incube');
    if (!isAllowedPage) {
        return null;
    }

    let startupId: string | undefined = undefined;
    if (params.id && typeof params.id === 'string' && pathname.includes('/startups/')) {
        startupId = params.id;
    }

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-4 pointer-events-none">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="w-[90vw] md:w-[400px] h-[600px] max-h-[80vh] pointer-events-auto shadow-2xl rounded-[24px]"
                    >
                        <AIChat startupId={startupId} />
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="pointer-events-auto">
                <PlasmaBotButton isOpen={isOpen} onClick={() => setIsOpen(!isOpen)} />
            </div>
        </div>
    );
}
