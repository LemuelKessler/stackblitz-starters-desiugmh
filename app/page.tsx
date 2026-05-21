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

  const downloadLossTemplate = () => {
    const csv = `tracking,type,value_brl,hub,status,description,loss_date,responsibility,root_cause,observation
`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'loss_template.csv';
    a.click();
  };

  const [filterType, setFilterType] = useState('missing');
const [visibleCount, setVisibleCount] = useState(20);

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
        const idxCountType = getIndex('count type');

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
          tracking: row[getIndex('tracking')] || '',
          type: row[getIndex('type')] || '',
          value_brl: parseFloat(
            row[getIndex('value_brl')]?.replace(',', '.') || '0'
          ),
          hub: row[getIndex('hub')] || '',
          status: row[getIndex('status')] || '',
          description: row[getIndex('description')] || '',
          loss_date: new Date(row[getIndex('loss_date')]).toISOString().split('T')[0],
          responsibility: row[getIndex('responsibility')] || '',
          observation: row[getIndex('observation')] || '',
          root_cause: row[getIndex('root_cause')] || '',
          created_at: new Date().toISOString().split('T')[0],
          }));
        const valid = formatted.filter((i) => i.tracking);

        const { data, error } = await supabase
  .from('loss_prevention')
  .insert(valid);

console.log('DADOS:', valid);
console.log('ERRO:', error);

if (error) {
  alert('Erro ao subir ❌');
  return;
}

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
  const accuracy =
total > 0 ? Number(((expected / total) * 100).toFixed(1)) : 0;
const getAccuracyColor = () => {
  if (accuracy >= 95) return 'green';
  if (accuracy >= 85) return 'yellow';
  return 'red';
};
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

  const backlog = data.filter((i) =>
  i.count_type?.toLowerCase().includes('backlog')
).length;

const exception = data.filter((i) =>
  i.count_type?.toLowerCase().includes('exception')
).length;

const missorted = data.filter((i) =>
  i.count_type?.toLowerCase().includes('mis')
).length;

const liquidate = data.filter((i) =>
  i.count_type?.toLowerCase().includes('liquidate')
).length;

const missing = data.filter((i) =>
  i.count_type?.toLowerCase().includes('missing')
).length;

  const chartData = [
    
    { name: 'Low Risk', value: low },
    { name: 'Moderate Risk', value: moderate },
    { name: 'High Risk', value: high }, 
  ];
  const countChartData = [
    { name: 'Backlog', value: backlog },
    { name: 'Exception', value: exception },
    { name: 'Mis-sorted', value: missorted },
    { name: 'Liquidate', value: liquidate },
    { name: 'Missing', value: missing },
  ];
  const filteredData = data.filter((item) =>
  item.count_type?.toLowerCase().trim().includes(filterType)
);
  return (
    <main className="flex min-h-screen bg-gray-100 text-gray-800">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-200 p-6">
  <h2 className="text-2xl font-bold mb-8 text-gray-800">
    Logistics AI
  </h2>

  <button
    onClick={() => setActiveTab('dashboard')}
    className={`block w-full text-left mb-3 px-3 py-2 rounded-lg transition ${
      activeTab === 'dashboard'
        ? 'bg-orange-100 text-orange-500 font-semibold'
        : 'text-gray-600 hover:text-orange-500 hover:bg-gray-100'
    }`}
  >
    📊 Dashboard
  </button>

  <button
    onClick={() => setActiveTab('loss')}
    className={`block w-full text-left mb-3 px-3 py-2 rounded-lg transition ${
      activeTab === 'loss'
        ? 'bg-orange-100 text-orange-500 font-semibold'
        : 'text-gray-600 hover:text-orange-500 hover:bg-gray-100'
    }`}
  >
    ⚠️ Loss Prevention
  </button>

  <button
    onClick={() => setActiveTab('analytics')}
    className={`block w-full text-left px-3 py-2 rounded-lg transition ${
      activeTab === 'analytics'
        ? 'bg-orange-100 text-orange-500 font-semibold'
        : 'text-gray-600 hover:text-orange-500 hover:bg-gray-100'
    }`}
  >
    📈 Analytics
  </button>
</aside>
      {/* CONTEÚDO */}
      <div className="flex-1 p-6 overflow-auto">
        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">

{/* HEADER */}
<div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-4">
  
  <div>
    <h1 className="text-2xl font-bold text-gray-900">
      Inventory Dashboard
    </h1>
    <p className="text-sm text-gray-500">
      Monitoramento em tempo real dos Hubs
    </p>
  </div>

  <div className="bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold">
    {total} registros
  </div>

</div>

{/* FILTROS */}
<div className="flex gap-4 flex-wrap items-center">

  <button
    onClick={() => setOpenImport(true)}
    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
  >
    Importar Inventário
  </button>

  <input
    type="date"
    value={startDate}
    onChange={(e) => setStartDate(e.target.value)}
    className="bg-gray-800 text-white p-2 rounded"
  />

  <input
    type="date"
    value={endDate}
    onChange={(e) => setEndDate(e.target.value)}
    className="bg-gray-800 text-white p-2 rounded"
  />

  <select
    value={hubFilter}
    onChange={(e) => setHubFilter(e.target.value)}
    className="bg-gray-800 text-white p-2 rounded"
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

</div>
<p className="text-gray-700 font-semibold">
 Total registros: {total}
</p>
            
            <div className="grid grid-cols-2 md:grid-cols-7 gap-4 mb-8">
            <Card 
  title="Accuracy" 
  value={`${accuracy}%`} 
  color={getAccuracyColor()} 
/>
              <Card title="Total" value={total} />
              <Card title="Expected" value={expected} color="green" />
              <Card title="Unexpected" value={unexpected} color="red" />
              <Card title="Low Risk" value={low} color="green" />
              <Card title="Moderate Risk" value={moderate} color="yellow" />
              <Card title="High Risk" value={high} color="red" />
              <Card title="On Hold" value={onHold} color="orange" />
              <Card title="Backlog" value={backlog} />
<Card title="Exception" value={exception} color="red" />
<Card title="Mis-sorted" value={missorted} color="yellow" />
<Card title="Liquidate" value={liquidate} color="black" />
<Card title="Missing" value={missing} color="red" />
            </div>

            <div className="bg-white shadow-sm border border-gray-200 p-6 rounded mb-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fill: '#6b7280' }} />
<YAxis tick={{ fill: '#6b7280' }} />
                  <Tooltip
    contentStyle={{
      backgroundColor: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
    }}
    labelStyle={{ color: '#374151' }}
  />
                  <Bar dataKey="value" fill="#f97316" radius={[6, 6, 0, 0]} />

                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white p-6 rounded mb-6 border border-gray-200">
  <h2 className="text-lg mb-4">Count Type</h2>

  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={countChartData}>
    <XAxis dataKey="name" tick={{ fill: '#6b7280' }} />
<YAxis tick={{ fill: '#6b7280' }} />
<Tooltip
    contentStyle={{
      backgroundColor: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
    }}
    labelStyle={{ color: '#374151' }}
  />
      <Bar dataKey="value" fill="#f97316" radius={[6, 6, 0, 0]} />

    </BarChart>
  </ResponsiveContainer>
</div>
<div className="flex gap-2 mb-4">
  {['missing', 'backlog', 'exception', 'mis-sorted', 'liquidate'].map((type) => (
    <button
      key={type}
      onClick={() => setFilterType(type)}
      className={`px-3 py-1 rounded-lg text-sm transition ${
        filterType === type
          ? 'bg-orange-500 text-white shadow-sm'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
      }`}
    >
      {type}
    </button>
  ))}
</div>
<table className="w-full text-sm bg-white rounded overflow-hidden">
  <thead>
    <tr className="text-left border-b border-gray-700">
      <th className="py-2">BR</th>
      <th className="py-2">HUB</th>
      <th className="py-2">AGING</th>
    </tr>
  </thead>

  <tbody>
    {data
      .filter((item) =>
        item.count_type?.toLowerCase().trim().includes(filterType)
      )
      .slice(0, visibleCount)
      .map((item, i) => (
        <tr key={i} className="border-b border-gray-800">
          <td className="py-1">{item.tracking}</td>
          <td>{item.hub}</td>
          <td>{item.aging}</td>
        </tr>
      ))}
  </tbody>
</table>
          </div>
        )}

        {/* LOSS */}
        {activeTab === 'loss' && (
  <div className="max-w-6xl mx-auto">

    <h1 className="text-3xl mb-4">Loss Prevention</h1>

    {/* BOTÕES */}
    <div className="flex gap-3 mb-4">
      
    <button
onClick={() => window.open('https://docs.google.com/spreadsheets/d/1h43SveNtsmxtTOl_72DLoxHB51H4nM-5aIKv1VgKyEU/copy')}
className="bg-gray-800 text-white px-4 py-2 rounded"
>
 Baixar Template
</button>

      <input type="file" onChange={uploadLoss} />

    </div>

    <p>Total perdas: {lossData.length}</p>

<table className="w-full text-sm bg-white rounded overflow-hidden mt-4">
  <thead>
    <tr className="border-b">
      <th>Tracking</th>
      <th>Tipo</th>
      <th>Valor (R$)</th>
      <th>HUB</th>
      <th>Status</th>
      <th>Responsável</th>
    </tr>
  </thead>

  <tbody>
    {lossData.map((item, i) => (
      <tr key={i} className="border-b">
        <td>{item.tracking}</td>
        <td>{item.type}</td>
        <td>{item.value_brl}</td>
        <td>{item.hub}</td>
        <td>{item.status}</td>
        <td>{item.responsibility}</td>
      </tr>
    ))}
  </tbody>
</table>

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
          <div className="bg-white p-6 rounded-xl w-[420px] shadow-xl">

<h2 className="text-xl font-bold mb-4 text-gray-800">
  Importar Inventário
</h2>

{/* DATA */}
<div className="mb-3">
  <label className="text-sm text-gray-600 block mb-1">
    Data do Inventário
  </label>
  <input
    type="date"
    value={inventoryDate}
    onChange={(e) => setInventoryDate(e.target.value)}
    className="w-full border border-gray-300 p-2 rounded bg-white text-gray-800"
  />
</div>

{/* HUB */}
<div className="mb-3">
  <label className="text-sm text-gray-600 block mb-1">
    Selecionar HUB
  </label>
  <select
    value={hub}
    onChange={(e) => setHub(e.target.value)}
    className="w-full border border-gray-300 p-2 rounded bg-white text-gray-800"
  >
    <option value="">Escolher HUB</option>
    <option value="LRJ-02">LRJ-02</option>
    <option value="LRJ-08">LRJ-08</option>
    <option value="LRJ-13">LRJ-13</option>
    <option value="LRJ-15">LRJ-15</option>
    <option value="LRJ-19">LRJ-19</option>
    <option value="LRJ-23">LRJ-23</option>
  </select>
</div>

{/* FILE */}
<div className="mb-4">
  <label className="text-sm text-gray-600 block mb-1">
    Arquivo CSV
  </label>
  <input
    type="file"
    onChange={(e) => {
      handleFileUpload(e);
      setOpenImport(false);
    }}
    className="w-full text-sm"
  />
</div>

{/* BOTÕES */}
<div className="flex gap-2">
  <button
    onClick={() => setOpenImport(false)}
    className="flex-1 border border-gray-300 p-2 rounded text-gray-700 hover:bg-gray-100"
  >
    Cancelar
  </button>

  <button
    onClick={() => setOpenImport(false)}
    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white p-2 rounded font-semibold"
  >
    Importar
  </button>
</div>

</div>

</div>  
)}     

</main>
);
}

// CARD
function Card({ title, value, color }: any) {
  const colors: any = {
    green: 'text-green-500',
    red: 'text-red-500',
    yellow: 'text-yellow-500',
    orange: 'text-orange-500',
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
    <p className="text-sm text-gray-500">
    {title}
    </p>
    
    <h2 className={`text-2xl font-bold ${
    color ? colors[color] : 'text-gray-900'
    }`}>
    {value}
    </h2>
    
    </div>
    );
    }