'use client';

import React from 'react';
import { 
  FileSearch, 
  PieChart, 
  Calculator, 
  Bot, 
  TrendingUp, 
  Search 
} from 'lucide-react';

const features = [
  {
    name: 'AI Statement Parsing',
    description: 'Our proprietary LLM models extract every transaction, merchant, and category from your PDF statements instantly.',
    icon: FileSearch,
    color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
  },
  {
    name: 'Unified Net Worth',
    description: 'Connect all your accounts and track your net worth in real-time with beautiful, interactive visualizations.',
    icon: PieChart,
    color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
  },
  {
    name: 'Tax Planner',
    description: 'Automated tax planning and 80C optimizations based on your spending history and income levels.',
    icon: Calculator,
    color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
  },
  {
    name: 'PeakBot Advisor',
    description: 'An AI-powered financial assistant that answers your queries and suggests localized investment strategies.',
    icon: Bot,
    color: 'bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-900/20 dark:text-fuchsia-400',
  },
  {
    name: 'Benchmark Metrics',
    description: 'Compare your spending and saving habits against peers and industry standards for better financial health.',
    icon: TrendingUp,
    color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
  },
  {
    name: 'CA Directory',
    description: 'Find and connect with certified chartered accountants for professional review and audit of your finances.',
    icon: Search,
    color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
  },
];

const Features: React.FC = () => {
  return (
    <div id="features" className="bg-white dark:bg-slate-950 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-bold leading-7 text-indigo-600 dark:text-indigo-400 uppercase tracking-widest animate-fade-in-down">Powerful Features</h2>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl animate-fade-in-up">
            Everything you need to master your finances
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-400 animate-fade-in-up delay-75">
            PeakPurse AI combines cutting-edge machine learning with financial expertise to give you a 360-degree view of your wealth.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            {features.map((feature, idx) => (
              <div 
                key={feature.name} 
                className={`flex flex-col animate-fade-in-up`}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <dt className="flex items-center gap-x-3 text-base font-bold leading-7 text-gray-900 dark:text-white">
                  <div className={`h-12 w-12 flex items-center justify-center rounded-xl ${feature.color} shadow-sm group-hover:scale-110 transition-transform`}>
                    <feature.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  {feature.name}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-sm leading-7 text-gray-600 dark:text-gray-400">
                  <p className="flex-auto">{feature.description}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
};

export default Features;
