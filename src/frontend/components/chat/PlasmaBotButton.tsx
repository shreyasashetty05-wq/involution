import React from 'react';
import { X } from 'lucide-react';

interface PlasmaBotButtonProps {
    isOpen: boolean;
    onClick: () => void;
}

export const PlasmaBotButton: React.FC<PlasmaBotButtonProps> = ({ isOpen, onClick }) => {
    return (
        <button 
            onClick={onClick}
            className="size-16 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95 pointer-events-auto relative group shadow-[0_0_20px_rgba(56,189,248,0.4)] hover:shadow-[0_0_35px_rgba(236,72,153,0.6)]"
            style={{ WebkitTapHighlightColor: 'transparent' }}
        >
            {/* Ultra Dark Plasma Container (No transparency) */}
            <div className="absolute inset-0 rounded-full overflow-hidden bg-[#010005] border-[2px] border-[#38bdf8]/80 shadow-[inset_0_0_25px_rgba(56,189,248,0.7)] transition-all duration-300 group-hover:border-[#ec4899]">
                
                {/* Deep background glow */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(236,72,153,0.25)_0%,transparent_60%)]"></div>
                
                {isOpen ? (
                    <div className="absolute inset-0 flex items-center justify-center z-50 bg-[#010005]/80 backdrop-blur-md">
                        <X className="size-6 text-[#38bdf8] drop-shadow-[0_0_10px_rgba(56,189,248,0.8)]" />
                    </div>
                ) : (
                    <>
                        {/* Atomic Nuclei Core */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-8 z-30 transition-all duration-300 ease-out group-hover:scale-125 flex items-center justify-center">
                            {/* Orbiting rings */}
                            <div className="absolute size-5 rounded-full border-t-2 border-r-2 border-[#ec4899] shadow-[0_0_10px_rgba(236,72,153,1)] animate-[spin_2s_linear_infinite]"></div>
                            <div className="absolute size-6 rounded-full border-b-2 border-l-2 border-[#38bdf8] shadow-[0_0_10px_rgba(56,189,248,1)] animate-[spin_3s_linear_infinite_reverse]"></div>
                            {/* Inner nodes */}
                            <div className="absolute size-1.5 rounded-full bg-[#c084fc] shadow-[0_0_12px_4px_rgba(192,132,252,1)] animate-pulse"></div>
                        </div>

                        {/* Ambient subtle tendrils (always on) */}
                        <div className="absolute inset-0 z-20 mix-blend-screen opacity-50 group-hover:opacity-10 transition-opacity duration-300">
                            <svg viewBox="0 0 100 100" className="w-full h-full animate-[spin_20s_linear_infinite]">
                                <path d="M50 50 Q 60 30 80 20" fill="none" stroke="#ec4899" strokeWidth="0.8" filter="drop-shadow(0 0 3px #ec4899)"/>
                                <path d="M50 50 Q 30 70 20 80" fill="none" stroke="#38bdf8" strokeWidth="0.8" filter="drop-shadow(0 0 3px #38bdf8)"/>
                            </svg>
                        </div>

                        {/* Lightning Burst on Hover */}
                        <div className="absolute inset-0 z-20 mix-blend-color-dodge scale-50 opacity-0 group-hover:scale-110 group-hover:opacity-100 transition-all duration-300 ease-out">
                            {/* Inner dense lightning */}
                            <svg viewBox="0 0 100 100" className="w-full h-full animate-[spin_4s_linear_infinite]">
                                {/* Pink Lightning */}
                                <path d="M50 50 L 55 35 L 45 25 L 65 15 L 60 5" fill="none" stroke="#ec4899" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" filter="drop-shadow(0 0 5px #ec4899)"/>
                                <path d="M50 50 L 65 60 L 75 50 L 85 70 L 95 65" fill="none" stroke="#ec4899" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" filter="drop-shadow(0 0 5px #ec4899)"/>
                                
                                {/* Blue Lightning */}
                                <path d="M50 50 L 35 65 L 45 75 L 25 85 L 30 95" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" filter="drop-shadow(0 0 5px #38bdf8)"/>
                                <path d="M50 50 L 35 40 L 25 50 L 15 30 L 5 35" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" filter="drop-shadow(0 0 5px #38bdf8)"/>
                            </svg>
                            
                            {/* Outer lightning rotating opposite direction */}
                            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full animate-[spin_5s_linear_infinite_reverse]">
                                <path d="M50 50 L 70 30 L 65 15 L 85 10 L 80 0" fill="none" stroke="#ec4899" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" filter="drop-shadow(0 0 4px #ec4899)"/>
                                <path d="M50 50 L 30 70 L 35 85 L 15 90 L 20 100" fill="none" stroke="#ec4899" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" filter="drop-shadow(0 0 4px #ec4899)"/>
                                <path d="M50 50 L 70 70 L 85 65 L 90 85 L 100 80" fill="none" stroke="#38bdf8" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" filter="drop-shadow(0 0 4px #38bdf8)"/>
                                <path d="M50 50 L 30 30 L 15 35 L 10 15 L 0 20" fill="none" stroke="#38bdf8" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" filter="drop-shadow(0 0 4px #38bdf8)"/>
                            </svg>
                        </div>

                        {/* Erratic Thunder Flashes on Hover */}
                        <div className="absolute inset-0 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none mix-blend-screen">
                            <div className="absolute inset-0 animate-[ping_0.5s_cubic-bezier(0,0,0.2,1)_infinite]">
                                <svg viewBox="0 0 100 100" className="w-full h-full">
                                    <path d="M50 50 L 60 45 L 75 60 L 98 45" fill="none" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="drop-shadow(0 0 8px #ec4899)"/>
                                    <path d="M50 50 L 40 55 L 25 40 L 2 55" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="drop-shadow(0 0 8px #38bdf8)"/>
                                </svg>
                            </div>
                        </div>
                    </>
                )}
            </div>
            
            {!isOpen && (
                <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#010005]/90 backdrop-blur-md text-[#38bdf8] text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-[0_0_15px_rgba(56,189,248,0.4)] pointer-events-none hidden md:block border border-[#38bdf8]/50">
                    Ask InVolution AI
                </span>
            )}
        </button>
    );
};
