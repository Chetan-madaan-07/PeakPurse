'use client';

import React from 'react';
import { ArrowRight, Shield, Zap, BarChart3 } from 'lucide-react';

interface HeroProps {
  onGetStarted: () => void;
}

const Hero: React.FC<HeroProps> = ({ onGetStarted }) => {
  return (
    <div className="relative overflow-hidden bg-white dark:bg-slate-950 py-24 sm:py-32">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden opacity-30 dark:opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400 blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-fuchsia-400 blur-[120px] animate-pulse delay-1000"></div>
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-8 flex justify-center animate-fade-in-down">
            <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-gray-600 dark:text-gray-400 ring-1 ring-gray-900/10 dark:ring-white/10 hover:ring-gray-900/20 dark:hover:ring-white/20 transition-all backdrop-blur-sm bg-white/50 dark:bg-slate-900/50">
              Announcing our new AI-powered tax advisor.{' '}
              <a href="#" className="font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter text-xs ml-1">
                <span className="absolute inset-0" aria-hidden="true" />
                Read more <span aria-hidden="true">&rarr;</span>
              </a>
            </div>
          </div>
          
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-6xl animate-fade-in-up">
            Master Your Money with{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600">
              PeakPurse AI
            </span>
          </h1>
          
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-400 animate-fade-in-up delay-75">
            The intelligent financial command center that parses your bank statements, optimizes your taxes, and provides expert wealth management advice—all in one secure place.
          </p>
          
          <div className="mt-10 flex items-center justify-center gap-x-6 animate-fade-in-up delay-150">
            <button
              onClick={onGetStarted}
              className="rounded-full bg-indigo-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 hover:bg-indigo-500 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group"
            >
              Get Started
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <a href="#features" className="text-sm font-bold leading-6 text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors uppercase tracking-widest">
              Learn more <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>

        {/* Floating cards for visual flair */}
        <div className="mt-20 flow-root sm:mt-24 animate-fade-in-up delay-300">
          <div className="relative -m-2 rounded-xl bg-gray-900/5 dark:bg-white/5 p-2 ring-1 ring-inset ring-gray-900/10 dark:ring-white/10 lg:-m-4 lg:rounded-2xl backdrop-blur-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-8">
               <div className="bg-white/70 dark:bg-slate-900/70 p-6 rounded-xl border border-white/20 dark:border-slate-800 shadow-soft hover:shadow-medium transition-shadow">
                  <Zap className="text-indigo-600 w-8 h-8 mb-4" />
                  <h3 className="font-bold text-gray-900 dark:text-white">Real-time Parsing</h3>
                  <p className="text-sm text-gray-500 mt-2">Instant extraction of data from any PDF bank statement with 99.9% accuracy.</p>
               </div>
               <div className="bg-white/70 dark:bg-slate-900/70 p-6 rounded-xl border border-white/20 dark:border-slate-800 shadow-soft hover:shadow-medium transition-shadow">
                  <Shield className="text-purple-600 w-8 h-8 mb-4" />
                  <h3 className="font-bold text-gray-900 dark:text-white">Bank-Grade Security</h3>
                  <p className="text-sm text-gray-500 mt-2">Your data never leaves our secure environment, protected by state-of-the-art encryption.</p>
               </div>
               <div className="bg-white/70 dark:bg-slate-900/70 p-6 rounded-xl border border-white/20 dark:border-slate-800 shadow-soft hover:shadow-medium transition-shadow">
                  <BarChart3 className="text-fuchsia-600 w-8 h-8 mb-4" />
                  <h3 className="font-bold text-gray-900 dark:text-white">Smart Analytics</h3>
                  <p className="text-sm text-gray-500 mt-2">Gain deep insights into your spending patterns and net worth growth automatically.</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
