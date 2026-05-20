'use client';

import Sidebar from '@/components/Sidebar';

export default function Analytics() {
  return (
    <div className="flex bg-black text-white">
      <Sidebar />

      <main className="min-h-screen w-full p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Analytics Dashboard</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-900 p-6 rounded-2xl">
              <p className="text-gray-400 mb-2">Weekly Loss Trend</p>

              <h2 className="text-5xl font-bold">Coming Soon</h2>
            </div>

            <div className="bg-gray-900 p-6 rounded-2xl">
              <p className="text-gray-400 mb-2">Root Cause Pareto</p>

              <h2 className="text-5xl font-bold">Coming Soon</h2>
            </div>

            <div className="bg-gray-900 p-6 rounded-2xl">
              <p className="text-gray-400 mb-2">HUB Ranking</p>

              <h2 className="text-5xl font-bold">Coming Soon</h2>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
