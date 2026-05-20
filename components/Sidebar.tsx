'use client';

import Link from 'next/link';

export default function Sidebar() {
  return (
    <div className="w-64 min-h-screen bg-black border-r border-gray-800 p-6">
      <h1 className="text-2xl font-bold text-white mb-10">Control Tower</h1>

      <div className="flex flex-col gap-4">
        <Link href="/" className="bg-gray-900 hover:bg-gray-800 p-4 rounded-xl">
          📦 Inventory
        </Link>

        <Link
          href="/loss-prevention"
          className="bg-gray-900 hover:bg-gray-800 p-4 rounded-xl"
        >
          💸 Loss Prevention
        </Link>

        <Link
          href="/analytics"
          className="bg-gray-900 hover:bg-gray-800 p-4 rounded-xl"
        >
          📊 Analytics
        </Link>
      </div>
    </div>
  );
}
