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

/**
 * Reveals text word-by-word based on scroll progress, optionally highlighting specified words.
 * @example
 * TextRevealScroll({
 *   text: "Hello world",
 *   className: "my ტექსტ",
 *   highlightWords: ["world"],
 *   highlightClass: "text-emerald-500",
 *   scrollOffset: ["start 95%", "start 25%"]
 * })
 * <div>Animated text reveal on scroll</div>
 * @param {TextRevealScrollProps} props - Component props including text content, styling, highlighted words, and scroll offset settings.
 * @returns {JSX.Element} A React element that renders the scroll-animated text reveal component.
 */
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

  let cumulativeWordCount = 0;
  
  // Pre-calculate word indices to avoid mutating variables during render
  const linesWithIndices = lines.map(line => {
    const words = line.split(" ");
    const lineData = words.map(word => {
      const isWord = word !== "";
      const wordIndex = isWord ? cumulativeWordCount++ : -1;
      return { word, wordIndex, isWord };
    });
    return lineData;
  });
  
  return (
    <div ref={container} className={`relative flex flex-col ${className}`}>
      {linesWithIndices.map((lineData, lineIndex) => (
        <div key={lineIndex} className="flex flex-wrap justify-center">
          {lineData.map((item, i) => {
            if (!item.isWord) return null;
            
            const start = item.wordIndex / totalWords;
            const end = start + 1 / totalWords;
            
            const cleanWord = item.word.replace(/[.,!?]/g, "");
            const isHighlighted = highlightWords.some(w => w.toLowerCase() === cleanWord.toLowerCase());
            
            return (
              <Word 
                key={i} 
                progress={scrollYProgress} 
                range={[start, end]}
                className={isHighlighted ? highlightClass : ""}
              >
                {item.word}
              </Word>
            );
          })}
        </div>
      ))}
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
