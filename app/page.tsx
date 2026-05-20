'use client';

import { useEffect, useState } from 'react';
import Papa from 'papaparse';
import { supabase } from '@/lib/supabase';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const [data, setData] = useState<any[]>([]);
  const [lossData, setLossData] = useState<any[]>([]);

  // filtros
  const [inventoryDate, setInventoryDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [hub, setHub] = useState('');
  const [openImport, setOpenImport] = useState(false);
  const [hubFilter, setHubFilter] = useState('');

  // ==========================
  // FETCH INVENTORY
  // ==========================
  const fetchData = async () => {
    let query = supabase.from('inventory').select('*');
    if (hubFilter) {
      query = query.eq('hub', hubFilter);
    }

    if (startDate && endDate) {
      query = query
        .gte('inventory_date', startDate)
        .lte('inventory_date', endDate);
    } else if (inventoryDate) {
      query = query.eq('inventory_date', inventoryDate);
    }

    let allData: any[] = [];
    let from = 0;
    let to = 999;

    while (true) {
      const { data, error } = await query.range(from, to);

      if (error) break;

      if (data && data.length > 0) {
        allData = [...allData, ...data];
      }

      if (!data || data.length < 1000) break;

      from += 1000;
      to += 1000;
    }

    setData(allData);
  };

  // ==========================
  // FETCH LOSS
  // ==========================
  const fetchLoss = async () => {
    const { data } = await supabase
      .from('loss_prevention')
      .select('*')
      .limit(5000);

    setLossData(data || []);
  };

  useEffect(() => {
    fetchData();
    fetchLoss();
  }, [inventoryDate, startDate, endDate, hubFilter]);

  // ==========================
  // UPLOAD INVENTORY
  // ==========================
  const handleFileUpload = (event: any) => {
    const file = event.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      skipEmptyLines: true,
      complete: async (results) => {
        const rows: any[] = results.data;
        const headers = rows[0];

        const getIndex = (name: string) =>
          headers.findIndex((h: string) => h?.toLowerCase().includes(name));

        const idxTracking = getIndex('tracking');
        const idxSort = getIndex('sort');
        const idxExpected = getIndex('expected');
        const idxAging = getIndex('aging');
        const idxHold = getIndex('hold');
        const idxCountType = getIndex('count');

        const finalDate =
          inventoryDate || new Date().toISOString().split('T')[0];

        if (!hub) {
          alert('Selecione o HUB antes de importar ❌');
          return;
        }
        const formatted = rows.slice(1).map((row: any) => ({
          tracking: row[idxTracking] || '',
          sort: row[idxSort] || '',
          expected: row[idxExpected] || '',
          aging: row[idxAging] || '',
          on_hold: row[idxHold] || '0',
          count_type: row[idxCountType] || '',
          inventory_date: finalDate,

          // 🔥 NOVO (ESSENCIAL)
          hub: hub,
        }));

        const valid = formatted.filter((i) => i.tracking);

        await supabase.from('inventory').insert(valid);

        alert('Upload Inventory 🚀');
        fetchData();
      },
    });
  };

  // ==========================
  // UPLOAD LOSS
  // ==========================
  const uploadLoss = (event: any) => {
    const file = event.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      skipEmptyLines: true,
      complete: async (res) => {
        const rows = res.data;
        const headers = rows[0];

        const getIndex = (name: string) =>
          headers.findIndex((h: string) => h?.toLowerCase().includes(name));

        const idxTracking = getIndex('tracking');

        if (idxTracking === -1) {
          alert('CSV inválido ❌');
          return;
        }

        const formatted = rows.slice(1).map((row: any) => ({
          tracking: row[idxTracking] || '',
          status: row[getIndex('status')] || '',
          type: row[getIndex('type')] || '',
          hub: row[getIndex('hub')] || '',
          created_at: new Date().toISOString().split('T')[0],
        }));

        const valid = formatted.filter((i) => i.tracking);

        await supabase.from('loss_prevention').insert(valid);

        alert('Upload Loss 🚀');
        fetchLoss();
      },
    });
  };

  // ==========================
  // AGING
  // ==========================
  const getAgingHours = (text: string) => {
    if (!text) return 0;
    const days = Number(text.match(/(\d+)d/)?.[1] || 0);
    const hours = Number(text.match(/(\d+)h/)?.[1] || 0);
    return days * 24 + hours;
  };

  // ==========================
  // MÉTRICAS
  // ==========================
  const total = data.length;

  const expected = data.filter((i) =>
    i.expected?.toLowerCase().includes('y')
  ).length;

  const unexpected = total - expected;

  const low = data.filter((i) => {
    const a = getAgingHours(i.aging);
    return a > 0 && a <= 48;
  }).length;

  const moderate = data.filter((i) => {
    const a = getAgingHours(i.aging);
    return a > 48 && a <= 168;
  }).length;

  const high = data.filter((i) => {
    const a = getAgingHours(i.aging);
    return a > 168;
  }).length;

  const onHold = data.filter((i) => Number(i.on_hold) > 0).length;

  const counted = data.filter((i) =>
    i.count_type?.toLowerCase().includes('count')
  ).length;

  const notCounted = data.filter((i) =>
    i.count_type?.toLowerCase().includes('not')
  ).length;

  const recount = data.filter((i) =>
    i.count_type?.toLowerCase().includes('recount')
  ).length;

  const chartData = [
    { name: 'Low', value: low },
    { name: 'Moderate', value: moderate },
    { name: 'High', value: high },
  ];

  return (
    <main className="flex min-h-screen bg-black text-white">
      {/* SIDEBAR */}
      <aside className="w-64 bg-zinc-900 p-6 border-r border-zinc-800">
        <h2 className="text-2xl font-bold mb-8">Logistics AI</h2>

        <button
          onClick={() => setActiveTab('dashboard')}
          className="block w-full text-left mb-2 hover:text-blue-400"
        >
          📊 Dashboard
        </button>

        <button
          onClick={() => setActiveTab('loss')}
          className="block w-full text-left mb-2 hover:text-red-400"
        >
          ⚠️ Loss Prevention
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className="block w-full text-left hover:text-purple-400"
        >
          📈 Analytics
        </button>
      </aside>

      {/* CONTEÚDO */}
      <div className="flex-1 p-6 overflow-auto">
        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="max-w-7xl mx-auto">
            <div className="flex gap-4 mb-6 flex-wrap items-center">
              <h1 className="text-4xl font-bold">Inventory Dashboard</h1>

              <button
                onClick={() => setOpenImport(true)}
                className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
              >
                Importar Inventário
              </button>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-gray-800 p-2 rounded"
              />

              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-gray-800 p-2 rounded"
              />

              <select
                value={hubFilter}
                onChange={(e) => setHubFilter(e.target.value)}
                className="bg-gray-800 p-2 rounded"
              >
                <option value="">Todos os HUBs</option>
                <option value="LRJ-02">LRJ-02</option>
                <option value="LRJ-08">LRJ-08</option>
                <option value="LRJ-13">LRJ-13</option>
                <option value="LRJ-15">LRJ-15</option>
                <option value="LRJ-19">LRJ-19</option>
                <option value="LRJ-23">LRJ-23</option>
              </select>
            </div>

            <p>Total registros: {total}</p>

            <div className="grid grid-cols-2 md:grid-cols-7 gap-4 mb-8">
              <Card title="Total" value={total} />
              <Card title="Expected" value={expected} color="green" />
              <Card title="Unexpected" value={unexpected} color="red" />
              <Card title="Low" value={low} color="green" />
              <Card title="Moderate" value={moderate} color="yellow" />
              <Card title="High" value={high} color="red" />
              <Card title="On Hold" value={onHold} color="orange" />
              <Card title="Counted" value={counted} color="green" />
              <Card title="Not Counted" value={notCounted} color="red" />
              <Card title="Recount" value={recount} color="yellow" />
            </div>

            <div className="bg-gray-900 p-6 rounded mb-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <table className="w-full text-sm">
              <tbody>
                {data.slice(0, 100).map((item, i) => (
                  <tr key={i}>
                    <td>{item.tracking}</td>
                    <td>{item.sort}</td>
                    <td>{item.expected}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* LOSS */}
        {activeTab === 'loss' && (
          <div>
            <h1 className="text-3xl mb-4">Loss Prevention</h1>
            <input type="file" onChange={uploadLoss} />
            <p>Total perdas: {lossData.length}</p>
          </div>
        )}

        {/* ANALYTICS */}
        {activeTab === 'analytics' && (
          <div>
            <h1 className="text-3xl mb-4">Analytics</h1>
            <p>Em breve: Pareto, insights e análises 📊</p>
          </div>
        )}
      </div>
      {openImport && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-zinc-900 p-6 rounded w-[400px]">
            <h2 className="text-xl mb-4">Importar Inventário</h2>

            <input
              type="date"
              value={inventoryDate}
              onChange={(e) => setInventoryDate(e.target.value)}
              className="w-full mb-3 bg-gray-800 p-2 rounded"
            />

            <select
              value={hub}
              onChange={(e) => setHub(e.target.value)}
              className="w-full mb-3 bg-gray-800 p-2 rounded"
            >
              <option value="">Selecionar HUB</option>
              <option value="LRJ-02">LRJ-02</option>
              <option value="LRJ-08">LRJ-08</option>
              <option value="LRJ-13">LRJ-13</option>
              <option value="LRJ-15">LRJ-15</option>
              <option value="LRJ-19">LRJ-19</option>
              <option value="LRJ-23">LRJ-23</option>
            </select>

            <input
              type="file"
              onChange={(e) => {
                handleFileUpload(e);
                setOpenImport(false);
              }}
              className="w-full mb-4"
            />

            <button
              onClick={() => setOpenImport(false)}
              className="w-full bg-red-600 p-2 rounded"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

// CARD
function Card({ title, value, color }: any) {
  const colors: any = {
    green: 'text-green-400',
    red: 'text-red-400',
    yellow: 'text-yellow-400',
    orange: 'text-orange-400',
  };

  return (
    <div className="bg-gray-900 p-4 rounded">
      <p>{title}</p>
      <h2 className={colors[color]}>{value}</h2>
    </div>
  );
}

