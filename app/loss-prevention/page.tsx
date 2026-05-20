'use client';

import { useState } from 'react';
import Papa from 'papaparse';

import Sidebar from '@/components/Sidebar';

export default function LossPrevention() {
  const [lossData, setLossData] = useState<any[]>([]);

  const handleLossUpload = (event: any) => {
    const file = event.target.files[0];

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,

      complete: (results) => {
        setLossData(results.data);
      },
    });
  };

  const totalLosses = lossData.length;

  const lostPackages = lossData.filter(
    (item) => item.Status && item.Status.toLowerCase().includes('lost')
  ).length;

  const damagedPackages = lossData.filter(
    (item) => item.Status && item.Status.toLowerCase().includes('damaged')
  ).length;

  const totalLossValue = lossData.reduce((acc, item) => {
    return acc + Number(item['Product Value'] || 0);
  }, 0);

  const liquidLosses = lossData.filter(
    (item) => item.Category && item.Category.toLowerCase().includes('liquid')
  ).length;

  const solidLosses = lossData.filter(
    (item) => item.Category && item.Category.toLowerCase().includes('solid')
  ).length;

  const topHub = () => {
    const hubCount: any = {};

    lossData.forEach((item) => {
      const hub = item.HUB || 'Unknown';

      hubCount[hub] = (hubCount[hub] || 0) + 1;
    });

    let top = '-';
    let max = 0;

    Object.keys(hubCount).forEach((hub) => {
      if (hubCount[hub] > max) {
        max = hubCount[hub];
        top = hub;
      }
    });

    return top;
  };

  const topRootCause = () => {
    const causeCount: any = {};

    lossData.forEach((item) => {
      const cause = item['Root Cause'] || 'Unknown';

      causeCount[cause] = (causeCount[cause] || 0) + 1;
    });

    let top = '-';
    let max = 0;

    Object.keys(causeCount).forEach((cause) => {
      if (causeCount[cause] > max) {
        max = causeCount[cause];
        top = cause;
      }
    });

    return top;
  };

  const downloadTemplate = () => {
    const csvContent = `Date,Week,BR,Tracking Number,Product Name,Category,Status,Product Value,HUB,Responsible Area,Root Cause,Comments
2026-05-16,W20,BR123456,SPXBR123456789,iPhone 15,Solid,Lost,5299,GIG,Sorting,Missroute,Package not found`;

    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;',
    });

    const link = document.createElement('a');

    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);

    link.setAttribute('download', 'loss_template.csv');

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
  };

  return (
    <div className="flex bg-black text-white">
      <Sidebar />

      <main className="min-h-screen w-full p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
            <h1 className="text-4xl font-bold">Loss Prevention Dashboard</h1>

            <div className="flex gap-4 flex-wrap">
              <button
                onClick={downloadTemplate}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl"
              >
                Download Template
              </button>

              <input
                type="file"
                accept=".csv"
                onChange={handleLossUpload}
                className="bg-red-900 p-2 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-8">
            <div className="bg-red-950 p-6 rounded-2xl">
              <p className="text-gray-400 mb-2">Total Occurrences</p>

              <h2 className="text-4xl font-bold">{totalLosses}</h2>
            </div>

            <div className="bg-red-950 p-6 rounded-2xl">
              <p className="text-gray-400 mb-2">Lost Packages</p>

              <h2 className="text-4xl font-bold text-red-500">
                {lostPackages}
              </h2>
            </div>

            <div className="bg-red-950 p-6 rounded-2xl">
              <p className="text-gray-400 mb-2">Damaged Packages</p>

              <h2 className="text-4xl font-bold text-yellow-400">
                {damagedPackages}
              </h2>
            </div>

            <div className="bg-red-950 p-6 rounded-2xl">
              <p className="text-gray-400 mb-2">Liquid Losses</p>

              <h2 className="text-4xl font-bold text-blue-400">
                {liquidLosses}
              </h2>
            </div>

            <div className="bg-red-950 p-6 rounded-2xl">
              <p className="text-gray-400 mb-2">Solid Losses</p>

              <h2 className="text-4xl font-bold text-gray-300">
                {solidLosses}
              </h2>
            </div>

            <div className="bg-red-950 p-6 rounded-2xl">
              <p className="text-gray-400 mb-2">Financial Impact</p>

              <h2 className="text-4xl font-bold text-green-400">
                R$ {totalLossValue.toFixed(2)}
              </h2>
            </div>

            <div className="bg-red-950 p-6 rounded-2xl">
              <p className="text-gray-400 mb-2">Top HUB</p>

              <h2 className="text-3xl font-bold text-purple-400">{topHub()}</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-red-950 p-6 rounded-2xl">
              <p className="text-gray-400 mb-2">Main Root Cause</p>

              <h2 className="text-5xl font-bold text-orange-400">
                {topRootCause()}
              </h2>
            </div>

            <div className="bg-red-950 p-6 rounded-2xl">
              <p className="text-gray-400 mb-2">Average Loss Value</p>

              <h2 className="text-5xl font-bold text-green-400">
                R${' '}
                {totalLosses > 0
                  ? (totalLossValue / totalLosses).toFixed(2)
                  : '0.00'}
              </h2>
            </div>
          </div>

          <div className="bg-red-950 rounded-2xl p-6 overflow-auto">
            <h2 className="text-2xl font-bold mb-6">Imported Losses</h2>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-red-800 text-left">
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Week</th>
                  <th className="pb-3">BR</th>
                  <th className="pb-3">Tracking</th>
                  <th className="pb-3">Product</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Value</th>
                  <th className="pb-3">HUB</th>
                  <th className="pb-3">Root Cause</th>
                </tr>
              </thead>

              <tbody>
                {lossData.slice(0, 100).map((item, index) => (
                  <tr
                    key={index}
                    className="border-b border-red-900 hover:bg-red-900"
                  >
                    <td className="py-3">{item.Date}</td>

                    <td>{item.Week}</td>

                    <td>{item.BR}</td>

                    <td>{item['Tracking Number']}</td>

                    <td>{item['Product Name']}</td>

                    <td>{item.Category}</td>

                    <td>{item.Status}</td>

                    <td>R$ {item['Product Value']}</td>

                    <td>{item.HUB}</td>

                    <td>{item['Root Cause']}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
