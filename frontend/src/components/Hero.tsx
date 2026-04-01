"use client";

import React from "react";
import { motion } from "motion/react";
import { ArrowRight, Info } from "lucide-react";

interface HeroProps {
  onGetStarted: () => void;
}

export default function Hero({ onGetStarted }: HeroProps) {
  const title = "Master Your Finances with PeakPurse AI";

  return (
    <div className="relative mx-auto my-10 flex max-w-7xl flex-col items-center justify-center">
      {/* Decorative gradient lines */}
      <div className="absolute inset-y-0 left-0 h-full w-px bg-neutral-200/80 dark:bg-neutral-800/80 pointer-events-none">
        <div className="absolute top-0 h-40 w-px bg-gradient-to-b from-transparent via-blue-500 to-transparent" />
      </div>
      <div className="absolute inset-y-0 right-0 h-full w-px bg-neutral-200/80 dark:bg-neutral-800/80 pointer-events-none">
        <div className="absolute h-40 w-px bg-gradient-to-b from-transparent via-blue-500 to-transparent" />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px w-full bg-neutral-200/80 dark:bg-neutral-800/80 pointer-events-none">
        <div className="absolute mx-auto h-px w-40 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
      </div>

      <div className="px-4 py-10 md:py-20">
        <h1 className="relative z-10 mx-auto max-w-4xl text-center text-3xl font-bold text-slate-800 md:text-5xl lg:text-7xl dark:text-slate-100 tracking-tight">
          {title.split(" ").map((word, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0, filter: "blur(4px)", y: 10 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              transition={{
                duration: 0.3,
                delay: index * 0.1,
                ease: "easeInOut",
              }}
              className="mr-2 inline-block"
            >
              <span className={word === "PeakPurse" || word === "AI" ? "text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600" : ""}>
                {word}
              </span>
            </motion.span>
          ))}
        </h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.8 }}
          className="relative z-10 mx-auto max-w-2xl py-6 text-center text-lg font-medium text-neutral-600 dark:text-neutral-400"
        >
          The intelligent financial command center that parses your bank statements, organizes your wealth, and provides expert AI-driven advice—all in one secure place.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 1 }}
          className="relative z-10 mt-8 flex flex-wrap items-center justify-center gap-4"
        >
          <button 
            onClick={onGetStarted}
            className="w-60 transform rounded-full bg-indigo-600 px-8 py-3 font-bold text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 transition-all duration-300 hover:-translate-y-1 hover:bg-indigo-500 hover:shadow-xl active:scale-95 flex items-center justify-center gap-2"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </button>
          <button 
            onClick={() => {
              document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-60 transform rounded-full border border-gray-200 bg-white px-8 py-3 font-bold text-gray-700 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:bg-gray-50 dark:border-gray-800 dark:bg-slate-900 dark:text-gray-200 dark:hover:bg-slate-800 flex items-center justify-center gap-2"
          >
            <Info className="w-4 h-4" />
            Explore Features
          </button>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 1.2 }}
          className="relative z-10 mt-20 rounded-3xl border border-neutral-200 bg-white/40 backdrop-blur-md p-4 shadow-xl dark:border-neutral-800 dark:bg-neutral-900/40"
        >
          <div className="w-full overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 shadow-inner group">
             <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-transparent to-purple-500/10 pointer-events-none group-hover:opacity-100 opacity-60 transition-opacity" />
            <img
              src="https://assets.aceternity.com/pro/aceternity-landing.webp"
              alt="PeakPurse Analytics Dashboard"
              className="aspect-[16/9] h-auto w-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-[1.01]"
              height={1000}
              width={1000}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
