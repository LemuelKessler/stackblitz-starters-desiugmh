'use client';

import { Line, CartesianGrid, ReferenceLine } from 'recharts';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  
} from 'recharts';

export default function ProjectPage() {

    const router = useRouter(); // 👈 ADICIONA ESSA LINHA
    
    const params = useParams();
    const id = params?.id as string;

  const [project, setProject] = useState<any>(null);
  const [data, setData] = useState<any[]>([]);
  const [openWhy, setOpenWhy] = useState<string | null>(null);
  const [actions, setActions] = useState<any[]>([]);
  const [aspForm, setAspForm] = useState({
    descricao_problema: '',
    data_inicio: '',
    data_fim: '',
    lider: '',
    numero_referencia: '',
    qa_responsavel: '',
    tipo_estudo: '',
    operacao: '',
    equipe: '',
    meta: '',
    historico: '',
    categoria: [] as string[],
    desperdicios: [] as string[],
  });

const [form5w2h, setForm5w2h] = useState({
  what: '',
  why: '',
  where: '',
  when: '',
  who: '',
  how: '',
  how_much: '',
});

const [whys, setWhys] = useState<any>({
  why1: '',
  why2: '',
  why3: '',
  why4: '',
  why5: '',
});

// ===== ISHIKAWA =====
const [ishikawa, setIshikawa] = useState<any[]>([]);
const [newItem, setNewItem] = useState('');
const [category, setCategory] = useState('Máquina');

const categories = [
  'Máquina',
  'Mão de obra',
  'Materia prima',
  'Método',
  'Meio ambiente',
  'Material',
];

// buscar itens
const fetchIshikawa = async () => {
  const { data } = await supabase
    .from('ishikawa_items')
    .select('*')
    .eq('project_id', id);

  setIshikawa(data || []);
};
const fetchActions = async () => {
    const { data } = await supabase
      .from('actions_5w2h')
      .select('*')
      .eq('project_id', id);
  
    setActions(data || []);
  };
// salvar item
const addItem = async () => {
    if (!newItem) return;
  
    const { error } = await supabase
      .from('ishikawa_items')
      .insert([
        {
          project_id: id,
          category,
          description: newItem,
        },
      ]);
  
    if (error) {
      console.log(error);
      alert('Erro ao salvar ❌');
      return;
    }
  
    setNewItem('');
    fetchIshikawa();
  };
  const deleteItem = async (itemId: string) => {
    const { error } = await supabase
      .from('ishikawa_items')
      .delete()
      .eq('id', itemId);
  
    if (error) {
      console.log(error);
      alert('Erro ao deletar ❌');
      return;
    }
  
    fetchIshikawa();
  };
  const deleteProject = async () => {
    const confirmDelete = confirm('Tem certeza que quer apagar o projeto?');
    if (!confirmDelete) return;
  
    const { error } = await supabase
      .from('asp_projects')
      .delete()
      .eq('id', id);
  
    if (error) {
      console.log(error);
      alert('Erro ao deletar ❌');
      return;
    }
  
    alert('Projeto apagado 🚀');
    router.push('/');
  };
  
  useEffect(() => {
    if (id) {
      fetchIshikawa();
      fetchActions(); // 👈 ADICIONA AQUI
    }
  }, [id]);
  // 🔥 BUSCAR PROJETO
  const fetchProject = async () => {
    const { data } = await supabase
      .from('asp_projects')
      .select('*')
      .eq('id', id)
      .single();

    setProject(data);
  };
  

  // 🔥 BUSCAR INVENTÁRIO DO HUB DO PROJETO
  const fetchData = async (hub: string) => {
    const { data } = await supabase
      .from('inventory')
      .select('*')
      .eq('hub', hub);

    setData(data || []);
  };
// 👇 👉 COLA AQUI 👇
const saveWhys = async (itemId: string) => {
    const { error } = await supabase
      .from('ishikawa_items')
      .update({
        why1: whys.why1,
        why2: whys.why2,
        why3: whys.why3,
        why4: whys.why4,
        why5: whys.why5,
      })
      .eq('id', itemId);
  
    if (error) {
      console.log(error);
      alert('Erro ao salvar 5 porquês ❌');
      return;
    }
  
    alert('Salvo 🚀');
  
    setOpenWhy(null);
    setWhys({
      why1: '',
      why2: '',
      why3: '',
      why4: '',
      why5: '',
    });
  
    fetchIshikawa();
  };
  // ===== 5W2H =====
const saveAction = async () => {
    if (!form5w2h.what || !form5w2h.who) {
      alert('Preencha pelo menos WHAT e WHO ❌');
      return;
    }
  
    const { error } = await supabase
      .from('actions_5w2h')
      .insert([
        {
          project_id: id,
          ...form5w2h,
          status: 'pendente',
          created_at: new Date().toISOString(),
        },
      ]);
  
    if (error) {
      console.log(error);
      alert('Erro ao salvar ação ❌');
      return;
    }
  
    alert('Ação criada 🚀');
  
    setForm5w2h({
      what: '',
      why: '',
      where: '',
      when: '',
      who: '',
      how: '',
      how_much: '',
    });
  
    fetchActions();
  };
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('asp_projects')
        .select('*')
        .eq('id', id)
        .single();

      if (data) {
        setProject(data);
        fetchData(data.hub); // 🔥 aqui conecta tudo
      }
    };

    if (id) load();
  }, [id]);
  if (!project) return <p className="p-6">Carregando...</p>;
  
  const paretoData = (project?.pareto_data || [])
  .sort((a: any, b: any) => Number(b.count) - Number(a.count));

const total = paretoData.reduce(
  (sum: number, item: any) => sum + Number(item.count),
  0
);

let cumulative = 0;

const chartData = paretoData.map((item: any) => {
  cumulative += Number(item.count);

  return {
    cause: item.cause,
    count: Number(item.count),
    cumulative: Number(((cumulative / total) * 100).toFixed(1)),
  };
});
  return (
    <div className="p-6 space-y-6">
<div className="mb-6 flex items-center justify-between">

<div className="text-sm text-gray-500 flex items-center gap-2">
  <span
    onClick={() => router.push('/')}
    className="cursor-pointer hover:text-gray-700"
  >
    Projetos
  </span>

  <span> / </span>

  <span className="text-gray-800 font-semibold">
    {project?.title || 'Projeto'}
  </span>
</div>

<button
  onClick={() => router.back()}
  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm"
>
  ← Voltar
</button>

</div>

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold">{project.title}</h1>
        <p className="text-gray-500">HUB: {project.hub}</p>
      </div>
{/* ===== FORMULÁRIO ASP ===== */}
<div className="bg-white p-6 rounded border space-y-4">
<h2 className="font-semibold mb-4 text-gray-800">📋 Análise do Problema (ASP)</h2>

  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <input
      placeholder="Descrição do problema"
      value={aspForm.problem}
      onChange={(e) => setAspForm({ ...aspForm, problem: e.target.value })}
      className="border border-gray-300 p-2 rounded bg-white text-gray-800 placeholder-gray-400"
    />

    <input
      type="date"
      value={aspForm.start_date}
      onChange={(e) => setAspForm({ ...aspForm, start_date: e.target.value })}
      className="border border-gray-300 p-2 rounded bg-white text-gray-800 placeholder-gray-400"
    />

    <input
      type="date"
      value={aspForm.end_date}
      onChange={(e) => setAspForm({ ...aspForm, end_date: e.target.value })}
      className="border border-gray-300 p-2 rounded bg-white text-gray-800 placeholder-gray-400"
    />
  </div>

  <input
    placeholder="Líder da análise"
    value={aspForm.leader}
    onChange={(e) => setAspForm({ ...aspForm, leader: e.target.value })}
    className="border p-2 rounded w-full"
  />

  <input
    placeholder="Categoria (Inbound, Outbound, etc)"
    value={aspForm.category}
    onChange={(e) => setAspForm({ ...aspForm, category: e.target.value })}
    className="border p-2 rounded w-full"
  />

  <textarea
    placeholder="1) Descrição detalhada do problema"
    value={aspForm.description}
    onChange={(e) => setAspForm({ ...aspForm, description: e.target.value })}
    className="border p-2 rounded w-full"
  />

  <textarea
    placeholder="2) Meta"
    value={aspForm.goal}
    onChange={(e) => setAspForm({ ...aspForm, goal: e.target.value })}
    className="border p-2 rounded w-full"
  />

  <textarea
    placeholder="3) Histórico do problema"
    value={aspForm.history}
    onChange={(e) => setAspForm({ ...aspForm, history: e.target.value })}
    className="border p-2 rounded w-full"
  />
</div>
      {/* PARETO */}
      <div className="bg-white p-6 rounded border">
      <h2 className="font-semibold mb-4 text-gray-800">📊 Pareto de Causas</h2>

      <ResponsiveContainer width="100%" height={350}>
  <BarChart data={chartData}>
    <CartesianGrid strokeDasharray="3 3" />

    <XAxis
  dataKey="cause"
  interval={0}
  angle={-30}
  textAnchor="end"
  height={100}
/>

    <YAxis yAxisId="left" />
    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />

    <Tooltip />

    <Bar yAxisId="left" dataKey="count" fill="#f97316" />

    <Line
  yAxisId="right"
  type="monotone"
  dataKey="cumulative"
  stroke="#2563eb"
  strokeWidth={3}
  dot={{ r: 3 }}
  activeDot={{ r: 6 }}
/>
    <ReferenceLine
  yAxisId="right"
  y={80}
  stroke="red"
  strokeDasharray="4 4"
  label="80%"
/>
  </BarChart>
</ResponsiveContainer>
      </div>
      {/* ISHIKAWA */}
      <div className="bg-white p-6 rounded border text-gray-800">
  <h2 className="font-semibold mb-4 text-gray-900">
    🧠 Ishikawa (Causa Raiz)
  </h2>

  <div className="flex gap-2 mb-4">
    <select
      value={category}
      onChange={(e) => setCategory(e.target.value)}
      className="border p-2 rounded bg-white text-black"
    >
      {categories.map((c) => (
        <option key={c}>{c}</option>
      ))}
    </select>

    <input
      type="text"
      placeholder="Descreva a causa..."
      value={newItem}
      onChange={(e) => setNewItem(e.target.value)}
      className="border p-2 rounded flex-1 bg-white text-black placeholder-gray-500"
    />

    <button
      onClick={addItem}
      className="bg-purple-600 text-white px-4 rounded hover:bg-purple-700"
    >
      +
    </button>
  </div>

  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
    {categories.map((cat) => (
      <div key={cat} className="border rounded p-3 bg-gray-50">
        <h3 className="font-semibold mb-2 text-gray-800">{cat}</h3>

        {ishikawa
  .filter((i) => i.category?.toLowerCase() === cat.toLowerCase())
  .map((item) => (
    <div
  key={item.id}
  className="text-sm bg-white text-gray-800 p-2 rounded mb-2 border"
>
  <div className="flex justify-between items-center">
    <p>{item.description}</p>
    
    <button
      onClick={() => deleteItem(item.id)}
      className="text-red-500 text-xs hover:text-red-700"
    >
      🗑
    </button>
  </div>

      {/* BOTÃO */}
      <button
        onClick={() => setOpenWhy(item.id)}
        className="text-xs text-purple-600 mt-1"
      >
        + 5 Porquês
      </button>
      <button
  onClick={() =>
    setShowWhy(showWhy === item.id ? null : item.id)
  }
  className="text-xs text-blue-600 mt-1 ml-2"
>
  👁 Ver análise
</button>
      {/* FORM */}
      {openWhy === item.id && (
  <div className="mt-2 space-y-2 border p-2 rounded bg-gray-50">

    {/* BOTÃO FECHAR */}
    <div className="flex justify-end">
      <button
        onClick={() => setOpenWhy(null)}
        className="text-xs text-red-500"
      >
        ✕ Fechar
      </button>
    </div>
    
    {[1,2,3,4,5].map((n) => (
      <input
        key={n}
        placeholder={`Por quê ${n}?`}
        value={whys[`why${n}`]}
        onChange={(e) =>
          setWhys({ ...whys, [`why${n}`]: e.target.value })
        }
        className="w-full border p-1 rounded text-xs text-black"
      />
    ))}

    <button
      onClick={() => saveWhys(item.id)}
      className="bg-purple-600 text-white px-2 py-1 rounded text-xs"
    >
      Salvar
    </button>
  </div>
)}
    </div>
))}
      </div>
    ))}
</div>
</div>
{/* ===== TABELA 5 PORQUÊS ===== */}
<div className="bg-white p-6 rounded border">
  <h2 className="font-semibold mb-4 text-gray-800">
    🧩 Análise de Causas (5 Porquês)
  </h2>

  <div className="overflow-auto">
    <table className="w-full text-sm border">
      <thead className="bg-gray-100 text-gray-700">
        <tr>
          <th className="p-2 border">Causa</th>
          <th className="p-2 border">Por quê 1</th>
          <th className="p-2 border">Por quê 2</th>
          <th className="p-2 border">Por quê 3</th>
          <th className="p-2 border">Por quê 4</th>
          <th className="p-2 border">Por quê 5</th>
          <th className="p-2 border">Salvar</th>
        </tr>
      </thead>

      <tbody>
        {ishikawa.map((item) => (
          <tr key={item.id} className="border-t">
            <td className="p-2 border font-medium">
              {item.description}
            </td>

            {[1,2,3,4,5].map((n) => (
              <td key={n} className="p-1 border">
                <input
                  defaultValue={item[`why${n}`] || ''}
                  onChange={(e) => {
                    item[`why${n}`] = e.target.value;
                  }}
                  className="w-full border p-1 rounded text-xs"
                />
              </td>
            ))}

            <td className="p-2 border">
              <button
                onClick={async () => {
                  await supabase
                    .from('ishikawa_items')
                    .update({
                      why1: item.why1,
                      why2: item.why2,
                      why3: item.why3,
                      why4: item.why4,
                      why5: item.why5,
                    })
                    .eq('id', item.id);

                  alert('Salvo 🚀');
                }}
                className="bg-green-600 text-white px-2 py-1 rounded text-xs"
              >
                💾
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
{/* ===== 5W2H ===== */}
<div className="bg-white p-6 rounded border">
<h2 className="font-semibold mb-4 text-gray-800">📋 Plano de Ação (5W2H)</h2>

<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

  <div>
    <label className="text-sm text-gray-600">What (o que será feito)</label>
    <input
      value={form5w2h.what}
      onChange={(e) => setForm5w2h({ ...form5w2h, what: e.target.value })}
      className="mt-1 w-full border border-gray-300 p-2 rounded bg-white text-gray-800"
    />
  </div>

  <div>
    <label className="text-sm text-gray-600">Who (responsável)</label>
    <input
      value={form5w2h.who}
      onChange={(e) => setForm5w2h({ ...form5w2h, who: e.target.value })}
      className="mt-1 w-full border border-gray-300 p-2 rounded bg-white text-gray-800"
    />
  </div>

  <div>
    <label className="text-sm text-gray-600">Why (por quê)</label>
    <input
      value={form5w2h.why}
      onChange={(e) => setForm5w2h({ ...form5w2h, why: e.target.value })}
      className="mt-1 w-full border border-gray-300 p-2 rounded bg-white text-gray-800"
    />
  </div>

  <div>
    <label className="text-sm text-gray-600">Where (onde)</label>
    <input
      value={form5w2h.where}
      onChange={(e) => setForm5w2h({ ...form5w2h, where: e.target.value })}
      className="mt-1 w-full border border-gray-300 p-2 rounded bg-white text-gray-800"
    />
  </div>

  <div>
    <label className="text-sm text-gray-600">When (quando)</label>
    <input
      value={form5w2h.when}
      onChange={(e) => setForm5w2h({ ...form5w2h, when: e.target.value })}
      className="mt-1 w-full border border-gray-300 p-2 rounded bg-white text-gray-800"
    />
  </div>

  <div>
    <label className="text-sm text-gray-600">How (como)</label>
    <input
      value={form5w2h.how}
      onChange={(e) => setForm5w2h({ ...form5w2h, how: e.target.value })}
      className="mt-1 w-full border border-gray-300 p-2 rounded bg-white text-gray-800"
    />
  </div>

  <div className="md:col-span-2">
    <label className="text-sm text-gray-600">How much (custo)</label>
    <input
      value={form5w2h.how_much}
      onChange={(e) => setForm5w2h({ ...form5w2h, how_much: e.target.value })}
      className="mt-1 w-full border border-gray-300 p-2 rounded bg-white text-gray-800"
    />
  </div>

</div>

<button
  onClick={saveAction}
  className="mt-6 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
>
  + Criar ação
</button>
  <div className="mt-4">
  {actions.map((a) => (
    <div className="border border-gray-200 p-4 rounded-lg mb-3 bg-gray-50 shadow-sm">    
     {a.why && <p>🎯 {a.why}</p>}
  {a.where && <p>📍 {a.where}</p>}
  {a.when && <p>📅 {a.when}</p>}
  {a.how && <p>⚙️ {a.how}</p>}
  {a.how_much && <p>💰 {a.how_much}</p>}
</div>
))}
  </div>
</div>
</div>

  );
}