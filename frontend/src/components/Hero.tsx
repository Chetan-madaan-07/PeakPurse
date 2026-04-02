"use client";

import React from "react";
import { motion } from "motion/react";
import { ArrowRight, Info } from "lucide-react";

interface HeroProps {
  onGetStarted: () => void;
}

export default function Hero({ onGetStarted }: HeroProps) {
  const title = "Financial Clarity Starts with PeakPurse AI";

  return (
    <div className="relative mx-auto my-10 flex max-w-7xl flex-col items-center justify-center">
      {/* Decorative gradient lines */}
      <div className="absolute inset-y-0 left-0 h-full w-px bg-neutral-200/50 dark:bg-neutral-800/50 pointer-events-none">
        <div className="absolute top-0 h-48 w-px bg-gradient-to-b from-transparent via-indigo-500 to-transparent shadow-[0_0_15px_rgba(79,70,229,0.5)]" />
      </div>
      <div className="absolute inset-y-0 right-0 h-full w-px bg-neutral-200/50 dark:bg-neutral-800/50 pointer-events-none">
        <div className="absolute h-48 w-px bg-gradient-to-b from-transparent via-fuchsia-500 to-transparent shadow-[0_0_15px_rgba(192,38,211,0.5)]" />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px w-full bg-neutral-200/50 dark:bg-neutral-800/50 pointer-events-none">
        <div className="absolute mx-auto h-px w-64 bg-gradient-to-r from-transparent via-purple-500 to-transparent shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
      </div>

      <div className="px-4 py-12 md:py-32">
        <h1 className="relative z-10 mx-auto max-w-5xl text-center text-3xl font-extrabold text-slate-900 md:text-6xl lg:text-8xl dark:text-white tracking-tighter leading-[1.1]">
          {title.split(" ").map((word, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0, filter: "blur(10px)", y: 20 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              transition={{
                duration: 0.4,
                delay: index * 0.08,
                ease: [0.21, 0.47, 0.32, 0.98],
              }}
              className="mr-3 inline-block"
            >
              <span className={word === "PeakPurse" || word === "AI" || word === "Financial" ? "text-transparent bg-clip-text bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600" : ""}>
                {word}
              </span>
            </motion.span>
          ))}
        </h1>
        
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="relative z-10 mx-auto max-w-2xl py-8 text-center text-lg md:text-xl font-medium text-neutral-600 dark:text-neutral-400 leading-relaxed"
        >
          Stop wrestling with PDFs. Our AI engine parses bank statements in seconds, 
          uncovers hidden tax savings, and generates personalized wealth plans 
          with professional-grade accuracy.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 1.1 }}
          className="relative z-10 mt-6 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4"
        >
          <button 
            onClick={onGetStarted}
            className="group relative inline-flex h-12 sm:h-14 w-full sm:w-64 items-center justify-center overflow-hidden rounded-full bg-indigo-600 px-8 font-bold text-white shadow-2xl transition-all duration-300 hover:bg-indigo-500 hover:shadow-indigo-500/25 active:scale-95"
          >
            <span className="relative z-10 flex items-center gap-2">
              Analyze Statement
              <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </button>
          
          <button 
            onClick={() => {
              document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="h-12 sm:h-14 w-full sm:w-64 rounded-full border border-neutral-200 bg-white/50 backdrop-blur-sm px-8 font-bold text-slate-700 shadow-sm transition-all duration-300 hover:border-indigo-200 hover:bg-white hover:text-indigo-600 dark:border-neutral-800 dark:bg-slate-900/50 dark:text-gray-300 dark:hover:border-indigo-900 dark:hover:text-indigo-400 flex items-center justify-center gap-2"
          >
            <Info className="h-4 w-4" />
            Explore Engine
          </button>
        </motion.div>
        

      </div>
    </div>
  );
}
