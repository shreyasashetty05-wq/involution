"use client";

import { motion } from "framer-motion";
import { User, Building2, GraduationCap } from "lucide-react";

interface RoleToggleProps {
    role: string;
    setRole: (role: string) => void;
}

/**
 * Shared role toggle component used on login and register pages.
 */
export function RoleToggle({ role, setRole }: RoleToggleProps) {
    const roles = [
        { value: "investor", label: "Investor", icon: User },
        { value: "startup", label: "Startup", icon: Building2 },
        { value: "incubation", label: "Student", icon: GraduationCap },
    ];

    return (
        <div className="flex bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60 mb-8 mx-auto w-full sm:w-fit relative backdrop-blur-sm shadow-inner">
            {roles.map((r) => {
                const Icon = r.icon;
                const isActive = role === r.value;
                
                return (
                    <button
                        key={r.value}
                        type="button"
                        onClick={() => setRole(r.value)}
                        className={`relative flex flex-col items-center justify-center gap-1 sm:gap-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors duration-300 z-10 flex-1 sm:w-28 sm:flex-none ${
                            isActive ? "text-white" : "text-slate-500 hover:text-slate-700"
                        }`}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="activeRole"
                                className="absolute inset-0 bg-gradient-to-b from-emerald-500 to-emerald-600 rounded-xl shadow-[0_4px_12px_rgba(16,185,129,0.3)]"
                                initial={false}
                                transition={{
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 30,
                                    duration: 0.3,
                                }}
                                style={{ originY: 0.5 }}
                                animate={{ scale: 1.03 }}
                            />
                        )}
                        <span className="relative z-10">
                            <Icon className={`size-5 ${isActive ? "text-emerald-50 drop-shadow-sm" : "text-slate-400"}`} />
                        </span>
                        <span className="relative z-10">{r.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
