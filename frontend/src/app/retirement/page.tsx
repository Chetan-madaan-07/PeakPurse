import RetirementCalculator from "@/components/RetirementCalculator";

export const metadata = {
  title: "Retirement Planner | PeakPurse",
  description: "Plan your retirement intelligently with auto-synced expenses and India-first tax strategies.",
};

export default function RetirementPage() {
  return (
    <main className="min-h-screen pt-20 pb-12 bg-gray-50 dark:bg-slate-900">
      <div className="max-w-5xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Retirement Intelligence</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            A zero-input engine that calculates your future lifestyle costs, adjusts for healthcare inflation, and maps a tax-optimized SIP strategy.
          </p>
        </div>
        <RetirementCalculator />
      </div>
    </main>
  );
}