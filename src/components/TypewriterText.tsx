"use client";

import { motion } from "framer-motion";
import React from "react";

interface TypewriterTextProps {
  text: string;
  className?: string;
  delay?: number;
  highlightWords?: string[];
  highlightClass?: string;
}

export function TypewriterText({ 
  text, 
  className = "", 
  delay = 0,
  highlightWords = [],
  highlightClass = "text-emerald-500"
}: TypewriterTextProps) {
  const words = text.split(" ");

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { 
        staggerChildren: 0.02, 
        delayChildren: delay 
      },
    },
  };

  const child = {
    visible: {
      opacity: 1,
      display: "inline-block",
    },
    hidden: {
      opacity: 0,
      display: "inline-block",
    },
  };

  return (
    <motion.span
      className={`inline-block ${className}`}
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
    >
      {words.map((word, wordIndex) => {
        // Clean the word for highlighting check (remove punctuation)
        const cleanWord = word.replace(/[.,!?]/g, "");
        const isMatch = highlightWords.some(w => w.toLowerCase() === cleanWord.toLowerCase());
        const highlightModifier = isMatch ? highlightClass : "";

        return (
          <React.Fragment key={wordIndex}>
            <span className="inline-block whitespace-nowrap">
              {word.split("").map((char, charIndex) => (
                <motion.span 
                  variants={child} 
                  key={charIndex} 
                  className={`${highlightModifier}`}
                >
                  {char}
                </motion.span>
              ))}
            </span>
            {wordIndex < words.length - 1 && (
              <motion.span variants={child} className="inline-block">
                &nbsp;
              </motion.span>
            )}
          </React.Fragment>
        );
      })}
    </motion.span>
  );
}
