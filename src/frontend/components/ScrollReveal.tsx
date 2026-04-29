"use client";

import React from "react";
import { motion } from "framer-motion";

/**
 * Wraps content in a motion container that fades and slides into view when scrolled into the viewport.
 * @param children - The content to animate on scroll.
 * @param className - Optional CSS class name applied to the wrapper element.
 * @param delay - Delay in seconds before the reveal animation starts.
 * @param y - Initial vertical offset in pixels before the element animates into place.
 */
export default function ScrollReveal({
    children,
    className,
    delay = 0,
    y = 18,
}: {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    y?: number;
}) {
    return (
        <motion.div
            className={className}
            initial={{ opacity: 0, y }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.55, ease: "easeOut", delay }}
        >
            {children}
        </motion.div>
    );
}
