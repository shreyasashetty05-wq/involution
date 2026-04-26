"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";

interface TextRevealScrollProps {
  text: string;
  className?: string;
  highlightWords?: string[];
  highlightClass?: string;
  scrollOffset?: any;
}

export function TextRevealScroll({ 
  text, 
  className = "",
  highlightWords = [],
  highlightClass = "text-emerald-500",
  scrollOffset = ["start 95%", "start 25%"]
}: TextRevealScrollProps) {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: scrollOffset,
  });

  const lines = text.split("\n");
  const totalWords = text.replace(/\n/g, " ").split(" ").filter(w => w !== "").length;
  let wordCount = 0;

  return (
    <div ref={container} className={`relative flex flex-col ${className}`}>
      {lines.map((line, lineIndex) => {
        const words = line.split(" ");
        return (
          <div key={lineIndex} className="flex flex-wrap justify-center">
            {words.map((word, i) => {
              if (word === "") return null;
              const start = wordCount / totalWords;
              const end = start + 1 / totalWords;
              wordCount++;
              
              const cleanWord = word.replace(/[.,!?]/g, "");
              const isHighlighted = highlightWords.some(w => w.toLowerCase() === cleanWord.toLowerCase());
              
              return (
                <Word 
                  key={i} 
                  progress={scrollYProgress} 
                  range={[start, end]}
                  className={isHighlighted ? highlightClass : ""}
                >
                  {word}
                </Word>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

interface WordProps {
  children: React.ReactNode;
  progress: MotionValue<number>;
  range: [number, number];
  className?: string;
}

function Word({ children, progress, range, className }: WordProps) {
  const opacity = useTransform(progress, range, [0, 1]);
  return (
    <span className="relative mr-1.5 lg:mr-2 mt-1 transition-colors duration-300">
      <span className={`opacity-20 ${className}`}>{children}</span>
      <motion.span style={{ opacity }} className={`absolute left-0 top-0 ${className}`}>{children}</motion.span>
    </span>
  );
}
