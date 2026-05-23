'use client';
import {
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useRouter } from 'next/navigation';
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
function Card({ title, value, color }: any) {
  const colorMap: any = {
    green: 'text-green-600',
    red: 'text-red-600',
    yellow: 'text-yellow-500',
    orange: 'text-orange-500',
    black: 'text-gray-900',
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
      <p className="text-sm text-gray-500">{title}</p>
      <h2 className={`text-xl font-bold ${colorMap[color] || 'text-gray-800'}`}>
        {value}
      </h2>
    </div>
  );
}
export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const router = useRouter();
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
const [selectedHub, setSelectedHub] = useState('');
const [selectedDate, setSelectedDate] = useState('');
const [analyticsHub, setAnalyticsHub] = useState('');
const [analyticsStartDate, setAnalyticsStartDate] = useState('');
const [analyticsEndDate, setAnalyticsEndDate] = useState('');
const [projects, setProjects] = useState<any[]>([]);
  // filtros
  const [inventoryDate, setInventoryDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [hub, setHub] = useState('');
  const [openImport, setOpenImport] = useState(false);
  const [hubFilter, setHubFilter] = useState('');
  const [lossStartDate, setLossStartDate] = useState('');
const [lossEndDate, setLossEndDate] = useState('');
const [openLossImport, setOpenLossImport] = useState(false);
const [lossHub, setLossHub] = useState('');


// ===== ASP PROJECT =====
const [openCreateProject, setOpenCreateProject] = useState(false);
const [projectName, setProjectName] = useState('');
const [projectHub, setProjectHub] = useState('');
const [openPasteModal, setOpenPasteModal] = useState(false);
const [pasteText, setPasteText] = useState('');
const [batchCause, setBatchCause] = useState('');

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
// FETCH PROJECTS
// ==========================
const fetchProjects = async () => {
  const { data, error } = await supabase
    .from('asp_projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (!error) {
    setProjects(data || []);
  }
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
    fetchProjects(); // 👈 ADICIONA AQUI
  }, [inventoryDate, startDate, endDate, hubFilter]);

  // ==========================
  // UPLOAD INVENTORY
  // ==========================
    // ==========================
    const handleFileUpload = (event: any) => {
      const file = event.target.files[0];
      if (!file) return;
    
      Papa.parse(file, {
        skipEmptyLines: true,
        complete: async (res) => {
          const rows = res.data;
          const headers = rows[0];
    
          const getIndex = (name: string) =>
            headers.findIndex((h: string) =>
              h?.toLowerCase().includes(name)
            );
    
          const formatted = rows.slice(1).map((row: any) => ({
            tracking: row[getIndex('tracking')] || '',
            hub: hub, // vem do select do modal
            inventory_date: inventoryDate,
            aging: row[getIndex('aging')] || '',
            count_type: row[getIndex('count')] || '',
            expected: row[getIndex('expected')] || '',
            on_hold: Number(row[getIndex('on_hold')] || 0),
            created_at: new Date().toISOString(),
          }));
    
          const valid = formatted.filter((i) => i.tracking);
    
          const { error } = await supabase
            .from('inventory')
            .insert(valid);
    
          if (error) {
            console.log(error);
            alert('Erro ao subir inventário ❌');
            return;
          }
          await fetchProjects(); // 👈 AQUI
          alert('Inventário enviado 🚀');
          fetchData();
        },
      });
    };
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
        headers.findIndex((h: string) =>
          h?.toLowerCase().includes(name)
        );

      const idxTracking = getIndex('tracking');

      if (idxTracking === -1) {
        alert('CSV inválido ❌');
        return;
      }

      const formatted = rows.slice(1).map((row: any) => {
        const rawDate = row[getIndex('loss_date')];

        let formattedDate = null;

        if (rawDate) {
          if (rawDate.includes('/')) {
            const [day, month, year] = rawDate.split('/');
            formattedDate = `${year}-${month}-${day}`;
          } else {
            formattedDate = rawDate;
          }
        }

        return {
          tracking: row[getIndex('tracking')] || '',
          type: row[getIndex('type')] || '',
          value_brl: parseFloat(
            (row[getIndex('value_brl')] || '0')
              .replace(/\./g, '')
              .replace(',', '.')
          ),
          hub: row[getIndex('hub')] || '',
          status: row[getIndex('status')] || '',
          description: row[getIndex('description')] || '',
          loss_date: formattedDate,
          responsibility: row[getIndex('responsibility')] || '',
          observation: row[getIndex('observation')] || '',
          root_cause: row[getIndex('root_cause')] || '',
          created_at: new Date().toISOString().split('T')[0],
        };
      });

      const valid = formatted.filter((i) => i.tracking);

      const { error } = await supabase
        .from('loss_prevention')
        .insert(valid);

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
  // UPLOAD LOSS
  // ==========================
  const handlePasteBatch = async () => {
    if (!pasteText || !batchCause || !selectedHub || !selectedDate) {
      alert('Preencha HUB, DATA, BRs e causa ❌');
      return;
    }
  
    const brList = pasteText
      .split('\n')
      .map((i) => i.trim())
      .filter((i) => i);
  
    if (brList.length === 0) {
      alert('Nenhum BR válido ❌');
      return;
    }
  
    const { error } = await supabase
      .from('inventory')
      .update({ root_cause: batchCause })
      .in('tracking', brList)
      .eq('hub', selectedHub)
      .eq('inventory_date', selectedDate);
  
    if (error) {
      console.log(error);
      alert('Erro ao atualizar ❌');
      return;
    }
  
    alert(`Atualizado ${brList.length} BRs 🚀`);
  
    setOpenPasteModal(false);
    setPasteText('');
    setBatchCause('');
  
    fetchData();
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
  
const COLORS = ['#ef4444', '#f97316']; // vermelho e laranja
  const total = data.length;

  const expected = data.filter((i) =>
    i.expected?.toLowerCase().includes('y')
  ).length;
  const missing = data.filter((i) =>
  i.count_type?.toLowerCase().includes('missing')
).length;
  const totalBipado = total - missing;

const accuracy =
total > 0 ? Number(((totalBipado / total) * 100).toFixed(1)) : 0;

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
const filteredLossData = lossData.filter((item) => {

  if (lossHub && item.hub !== lossHub) return false;

  if (!item.loss_date) return true;

  if (lossStartDate && lossEndDate) {
    return item.loss_date >= lossStartDate && item.loss_date <= lossEndDate;
  }

  return true;
});
const lostCount = filteredLossData.filter((i) =>
  i.status?.toLowerCase().includes('lost') ||
  i.status?.toLowerCase().includes('extravio')
).length;

const damagedCount = filteredLossData.filter((i) =>
  i.status?.toLowerCase().includes('damaged') ||
  i.status?.toLowerCase().includes('avaria')
).length;
  

const pieData = [
  { name: 'Lost', value: lostCount },
  { name: 'Damaged', value: damagedCount },
];

  const totalLossValue = filteredLossData.reduce(
    (acc, item) => acc + Number(item.value_brl || 0),
   0
   );

   const solid = filteredLossData.filter((i) =>
   i.type?.toLowerCase().includes('solid')
   ).length;
   const liquid = filteredLossData.filter((i) =>
   i.type?.toLowerCase().includes('liquid')
   ).length;

   const createProject = async () => {
    if (!projectName || !projectHub) {
      alert('Preenche tudo ❌');
      return;
    }
  
    const relatedItems = data.filter(
      (item) => item.hub === projectHub
    );
  
    const totalItems = relatedItems.length;
  
    const causes = relatedItems.reduce((acc: any, item: any) => {
      const cause = item.root_cause?.trim() || 'Sem causa';
      acc[cause] = (acc[cause] || 0) + 1;
      return acc;
    }, {});
  
    const mainCause =
      Object.entries(causes).sort(
        (a: any, b: any) => b[1] - a[1]
      )[0]?.[0] || 'Sem causa';
  
    const { error } = await supabase.from('asp_projects').insert([
      {
        title: projectName,
        hub: projectHub,
        status: 'aberto',
        created_at: new Date().toISOString(),
      },
    ]);
  
    if (error) {
      console.log(error);
      alert('Erro ao criar ❌');
      return;
    }
  
    alert(`Projeto criado 🚀`);
    setProjectName('');
    setProjectHub('');
    setOpenCreateProject(false);
  };
  const deleteProject = async (id: string) => {
    const confirmDelete = confirm('Tem certeza que quer apagar?');
  
    if (!confirmDelete) return;
  
    const { error } = await supabase
      .from('asp_projects')
      .delete()
      .eq('id', id);
  
    if (error) {
      alert('Erro ao apagar ❌');
      return;
    }
  
    alert('Projeto apagado 🗑');
    fetchProjects();
  };
  const paretoInsights = () => {
    if (!filteredAnalyticsData.length) return null;
   
    const causeMap: any = {};
   
    filteredAnalyticsData.forEach((item) => {
     const cause = item.root_cause || 'Não definido';
     causeMap[cause] = (causeMap[cause] || 0) + 1;
   });
  
    const sorted = Object.entries(causeMap)
      .map(([cause, value]) => ({ cause, value }))
      .sort((a: any, b: any) => b.value - a.value);
  
    const total = sorted.reduce((acc, i) => acc + i.value, 0);
  
    let cumulative = 0;
  
    const enriched = sorted.map((item) => {
      cumulative += item.value;
      return {
        ...item,
        percent: (item.value / total) * 100,
        cumulative: (cumulative / total) * 100,
      };
    });
  
    const critical = enriched.filter((i) => i.cumulative <= 80);
  
    return {
      totalCauses: enriched.length,
      criticalCauses: critical.length,
      criticalPercent: ((critical.length / enriched.length) * 100).toFixed(1),
      mainCause: enriched[0],
      criticalList: critical,
    };
  };
  // ==========================
// FILTRO ANALYTICS (PASSO 2)
// ==========================
const filteredAnalyticsData = data.filter((item) => {
  if (analyticsHub && item.hub !== analyticsHub) return false;

  if (analyticsStartDate && analyticsEndDate) {
    return (
      new Date(item.inventory_date) >= new Date(analyticsStartDate) &&
      new Date(item.inventory_date) <= new Date(analyticsEndDate)
    );
  }

  return true;
});  

const paretoData = Object.values(
  filteredAnalyticsData.reduce((acc: any, item: any) => {
   const cause = item.root_cause || 'Sem causa';
 
   if (!acc[cause]) {
     acc[cause] = {
       cause,
       count: 0,
     };
   }
 
   acc[cause].count += 1;
   return acc;
 }, {})
 ).sort((a: any, b: any) => b.count - a.count);
  return (
    <>
    <main className="flex flex-col md:flex-row min-h-screen bg-gray-100 text-gray-800">
      {/* SIDEBAR */}
      <aside className="hidden md:block md:w-46 bg-white border-r border-gray-200 p-3 md:p-6">
      <h2 className="text-2xl font-bold mb-8 text-gray-800">
  Inventory Control
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
      {/* MOBILE MENU */}
<div className="md:hidden flex justify-around bg-white border-b p-2">
  <button onClick={() => setActiveTab('dashboard')}>
    📊 Dashboard
  </button>

  <button onClick={() => setActiveTab('loss')}>
    ⚠️ Loss Prevention
  </button>

  <button onClick={() => setActiveTab('analytics')}>
    📈 Analytic
  </button>
</div>
<div className="flex-1 p-3 md:p-6">
        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">

{/* HEADER */}
<div className="flex justify-between items-center bg-white p-3 md:p-6 rounded-xl shadow-sm border border-gray-200 mb-4">
  
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
            
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-4 mb-8">
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
{/* ALERTAS AUTOMÁTICOS */}
<div className="bg-white p-4 rounded mb-4 border">
  <h2 className="font-semibold mb-2">🚨 Alertas</h2>

  <ul className="space-y-2 text-sm">

    {accuracy < 90 && (
      <li className="text-red-500">
        ⚠️ Acuracidade baixa ({accuracy}%)
      </li>
    )}

    {high > 10 && (
      <li className="text-orange-500">
        🔥 Muitos itens em High Risk ({high})
      </li>
    )}

    {missing > 50 && (
      <li className="text-red-500">
        📦 Alto volume de Missing ({missing})
      </li>
    )}

    {onHold > 30 && (
      <li className="text-yellow-500">
        ⏳ Muitos itens On Hold ({onHold})
      </li>
    )}

  </ul>
</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

  {/* RISK LEVEL */}
  <div className="bg-white shadow-sm border border-gray-200 p-3 md:p-6 rounded">
    <h2 className="mb-4 font-semibold">Risk Level</h2>

    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="value" fill="#f97316" />
      </BarChart>
    </ResponsiveContainer>
  </div>

  {/* COUNT TYPE */}
  <div className="bg-white p-3 md:p-6 rounded border border-gray-200">
    <h2 className="mb-4 font-semibold">Count Type</h2>

    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={countChartData}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="value" fill="#ef4444" />
      </BarChart>
    </ResponsiveContainer>
  </div>

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
<div className="overflow-x-auto">
  <table className="w-full text-sm bg-white rounded">
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
  </div>
)}

        {/* LOSS */}
        {activeTab === 'loss' && (
  <div className="max-w-6xl mx-auto">

<div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-4">
  <div>
    <h1 className="text-2xl font-bold text-gray-900">
      Loss Prevention
    </h1>
    <p className="text-sm text-gray-500">
      Monitoramento de perdas e avarias
    </p>
  </div>

  <div className="bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold">
    {filteredLossData.length} registros
  </div>
</div>
<div className="flex gap-4 flex-wrap items-center mb-4">
  <input
    type="date"
    value={lossStartDate}
    onChange={(e) => setLossStartDate(e.target.value)}
    className="bg-gray-800 text-white p-2 rounded"
  />
  <input
    type="date"
    value={lossEndDate}
    onChange={(e) => setLossEndDate(e.target.value)}
    className="bg-gray-800 text-white p-2 rounded"
  />
  <select
  value={lossHub}
  onChange={(e) => setLossHub(e.target.value)}
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
    <div className="flex gap-3 mb-4">
<button
onClick={() => window.open('https://docs.google.com/spreadsheets/d/1h43SveNtsmxtTOl_72DLoxHB51H4nM-5aIKv1VgKyEU/copy')}
className="bg-gray-800 text-white px-4 py-2 rounded"
>
 Baixar Template
</button>

<button
  onClick={() => setOpenLossImport(true)}
  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
>
  Importar Loss
</button>
</div>

<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
<Card title="Total Loss" value={filteredLossData.length} />
<Card title="Valor Total (R$)" value={`R$ ${totalLossValue}`} color="red" />
<Card title="Solid" value={solid} />
<Card title="Liquid" value={liquid} />
<Card title="Lost" value={lostCount} color="red" />
  <Card title="Damaged" value={damagedCount} color="yellow" />
</div>
<div className="bg-white p-3 md:p-6 rounded mb-6 border">
  <h2 className="mb-4 font-semibold">Lost vs Damaged</h2>

  <ResponsiveContainer width="100%" height={250}>
    <BarChart data={pieData}>
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Bar dataKey="value" fill="#ef4444" />
    </BarChart>
  </ResponsiveContainer>
</div>
    {/* BOTÕES */}
    
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
  {filteredLossData.map((item, i) => (
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
  <div className="max-w-7xl mx-auto">

    <div className="flex justify-between items-center mb-4">
      <h1 className="text-3xl">Analytics</h1>

      <div className="flex gap-2">
        <button
          onClick={() => setOpenPasteModal(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded"
        >
          Colar BRs
        </button>

        <button
          onClick={() => setOpenCreateProject(true)}
          className="bg-orange-500 text-white px-4 py-2 rounded"
        >
          + Criar Projeto
        </button>
  </div>
</div>
{/* resto do analytics continua aqui */}    {/* ===== KPIs GERAIS ===== */}
<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card title="Accuracy" value={`${accuracy}%`} />
      <Card title="Total Loss (R$)" value={`R$ ${totalLossValue}`} color="red" />
      <Card title="Missing" value={missing} color="red" />
      <Card title="On Hold" value={onHold} color="orange" />
    </div>

    {/* 👇 E COLOCA O PARETO AQUI */}
    <div className="bg-white p-6 rounded border">
  <h2 className="mb-4 font-semibold">Pareto de Causas</h2>
  <div className="flex gap-4 mb-4 flex-wrap">

<select
 value={analyticsHub}
 onChange={(e) => setAnalyticsHub(e.target.value)}
 className="bg-gray-800 text-white p-2 rounded"
>
<option value="">Todos HUBs</option>
<option value="LRJ-02">LRJ-02</option>
<option value="LRJ-08">LRJ-08</option>
<option value="LRJ-13">LRJ-13</option>
<option value="LRJ-15">LRJ-15</option>
<option value="LRJ-19">LRJ-19</option>
<option value="LRJ-23">LRJ-23</option>
</select>

<input
 type="date"
 value={analyticsStartDate}
 onChange={(e) => setAnalyticsStartDate(e.target.value)}
 className="bg-gray-800 text-white p-2 rounded"
/>

<input
 type="date"
 value={analyticsEndDate}
 onChange={(e) => setAnalyticsEndDate(e.target.value)}
 className="bg-gray-800 text-white p-2 rounded"
/>

</div>
  <ResponsiveContainer width="100%" height={400}>
    <BarChart data={paretoData}>
      <XAxis dataKey="cause" />
      <YAxis />
      <Tooltip />
      <Bar dataKey="count" fill="#7c3aed" />
    </BarChart>
  </ResponsiveContainer>
</div>
{paretoInsights() && (
  <div className="bg-white p-6 rounded-xl border mt-6">
    <h2 className="text-lg font-bold mb-4">
      🎯 Análise 80/20 (Pareto)
    </h2>

    <div className="space-y-3 text-sm">

      <p>
        🔥 <b>{paretoInsights().criticalCauses}</b> causas geram{" "}
        <b>80% dos problemas</b>
      </p>

      <p>
        📊 Isso representa apenas{" "}
        <b>{paretoInsights().criticalPercent}%</b> das causas totais
      </p>

      <p>
        🎯 <b>Foco operacional:</b> atacar essas causas primeiro
      </p>

      <div>
        <p className="font-semibold mt-2">🚨 Causas prioritárias:</p>
        <ul className="list-disc pl-5">
          {paretoInsights().criticalList.map((item: any, i: number) => (
            <li key={i}>
              {item.cause} ({item.cumulative.toFixed(1)}% acumulado)
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-2">
        🏆 Principal causa:{" "}
        <b>{paretoInsights().mainCause.cause}</b> (
        {paretoInsights().mainCause.percent.toFixed(1)}%)
      </p>

    </div>
    <div className="bg-white p-6 rounded border mt-6">
  <h2 className="font-bold mb-4">📂 Projetos ASP</h2>

  {projects.length === 0 && (
    <p className="text-gray-500">Nenhum projeto ainda</p>
  )}

{projects.map((p, i) => (
  <div
    key={i}
    className="p-3 border rounded mb-2 flex justify-between items-center hover:bg-gray-100"
  >
    <div
      onClick={() => router.push(`/projects/${p.id}`)}
      className="cursor-pointer"
    >
      <p className="font-semibold">{p.title}</p>
      <p className="text-sm text-gray-500">{p.hub}</p>
    </div>

    <button
      onClick={async () => {
        const confirmDelete = confirm('Apagar projeto?');
        if (!confirmDelete) return;

        const { error } = await supabase
          .from('asp_projects')
          .delete()
          .eq('id', p.id);

        if (error) {
          alert('Erro ao apagar ❌');
          return;
        }

        alert('Projeto apagado 🗑');
        fetchProjects();
      }}
      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
    >
      🗑
    </button>
  </div>
))}
</div>
  </div>
)}
    
  </div>
)}
      </div>
      {openImport && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          
          <div className="bg-white p-3 md:p-6 rounded-xl w-[420px] shadow-xl">
            

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
{openLossImport && (
<div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
<div className="bg-white p-3 md:p-6 rounded-xl w-[420px] shadow-xl">

<h2 className="text-xl font-bold mb-4 text-gray-800">
 Importar Loss
</h2>

<div className="mb-4">
<label className="text-sm text-gray-600 block mb-1">
 Arquivo CSV
</label>
<input
type="file"
onChange={(e) => {
uploadLoss(e);
setOpenLossImport(false);
}}

className="w-full text-sm"
/>
</div>
<div className="flex gap-2">
<button
onClick={() => setOpenLossImport(false)}
className="flex-1 border border-gray-300 p-2 rounded text-gray-700 hover:bg-gray-100"
>
 Cancelar
</button>

<button
onClick={() => setOpenLossImport(false)}
className="flex-1 bg-orange-500 hover:bg-orange-600 text-white p-2 rounded font-semibold"
>
 Fechar
</button>
</div>

</div>
</div>
)}

</main>
    
      {/* ===== MODAL COLAR BRs (FIXADO) ===== */}
      {openPasteModal && (
     <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[99999] backdrop-blur-sm">
     <div className="bg-white p-6 rounded-xl w-[400px] shadow-xl text-gray-800">
   
       <h2 className="text-xl font-bold mb-4">
         Classificação em lote (colar BRs)
       </h2>
       <select
  value={selectedHub}
  onChange={(e) => setSelectedHub(e.target.value)}
  className="w-full mb-3 p-2 border rounded text-black"
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
  type="date"
  value={selectedDate}
  onChange={(e) => setSelectedDate(e.target.value)}
  className="w-full mb-3 p-2 border rounded text-black"
/>
       <textarea
         placeholder="Cole os BRs aqui"
         value={pasteText}
         onChange={(e) => setPasteText(e.target.value)}
         className="w-full h-32 border border-gray-300 p-2 rounded mb-3 bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
       />
   
       <select
         value={batchCause}
         onChange={(e) => setBatchCause(e.target.value)}
         className="w-full mb-4 p-2 border border-gray-300 rounded bg-white text-black focus:outline-none focus:ring-2 focus:ring-purple-500"
       >
         <option value="">Selecionar causa</option>
         <option>LH Atrasado</option>
         <option>Desvio de forecast</option>
         <option>Comercial</option>
         <option>Misscan</option>
         <option>OnHold</option>
         <option>Volumoso não coube</option>
         <option>Backlog de Volumoso</option>
         <option>Erro de data</option>
         <option>Cubagem de moto</option>
         <option>Fora de rota</option>
         <option>Avaria</option>
         <option>Repack</option>
         <option>Baixo ADO</option>
         <option>Erro de realocação</option>
         <option>Erro de sort</option>
         <option>Erro de etiquetagem</option>
         <option>Bug sistemico</option>
         
       </select>
   
       <div className="flex gap-2">
         <button
           onClick={() => setOpenPasteModal(false)}
           className="flex-1 border border-gray-300 p-2 rounded text-gray-700 hover:bg-gray-100"
         >
           Cancelar
         </button>
   
         <button
           onClick={handlePasteBatch}
           className="flex-1 bg-purple-600 hover:bg-purple-700 text-white p-2 rounded"
         >
           Aplicar
         </button>
       </div>
   
     </div>
   </div>
      )}
      
    
      {/* ===== MODAL CREATE PROJECT ===== */}
      {openCreateProject && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999]">
          <div className="bg-white p-6 rounded-2xl w-[400px] shadow-2xl animate-scaleIn">
    
            <h2 className="text-xl font-bold mb-4">
              Criar Projeto ASP
            </h2>
    
            <input
  type="text"
  placeholder="Nome do projeto"
  value={projectName}
  onChange={(e) => setProjectName(e.target.value)}
  className="w-full mb-3 p-2 border rounded bg-white text-black"
/>
    
            <select
              value={projectHub}
              onChange={(e) => setProjectHub(e.target.value)}
              className="w-full mb-4 p-2 border rounded bg-white text-black"

            >
              <option value="">Selecionar HUB</option>
              <option value="LRJ-02">LRJ-02</option>
              <option value="LRJ-08">LRJ-08</option>
              <option value="LRJ-13">LRJ-13</option>
              <option value="LRJ-15">LRJ-15</option>
              <option value="LRJ-19">LRJ-19</option>
              <option value="LRJ-23">LRJ-23</option>
            </select>
    
            <div className="flex gap-2">
            <button
  onClick={() => setOpenCreateProject(false)}
  className="flex-1 border p-2 rounded text-gray-700 bg-gray-100 hover:bg-gray-200"
>
  Cancelar
</button>
    
              <button
                onClick={createProject}
                className="flex-1 bg-orange-500 text-white p-2 rounded"
              >
                Criar
              </button>
            </div>
    
          </div>
        </div>
      )}
      </>)}

