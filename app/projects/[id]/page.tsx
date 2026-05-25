'use client';

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

      {/* PARETO */}
      <div className="bg-white p-6 rounded border">
        <h2 className="font-semibold mb-4">📊 Pareto de Causas</h2>

        <ResponsiveContainer width="100%" height={300}>
        <BarChart data={project?.pareto_data || []}>
            <XAxis dataKey="cause" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#f97316" />
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

{/* ===== 5W2H ===== */}
<div className="bg-white p-6 rounded border">
  <h2 className="font-semibold mb-4">📋 Plano de Ação (5W2H)</h2>

<input
  placeholder="What (o que será feito)"
  value={form5w2h.what}
  onChange={(e) => setForm5w2h({ ...form5w2h, what: e.target.value })}
  className="border p-2 rounded w-full mb-2"
/>

<input
  placeholder="Who (responsável)"
  value={form5w2h.who}
  onChange={(e) => setForm5w2h({ ...form5w2h, who: e.target.value })}
  className="border p-2 rounded w-full mb-2"
/>

{/* 👇 COLA AQUI 👇 */}

<input
  placeholder="Why (por quê)"
  value={form5w2h.why}
  onChange={(e) => setForm5w2h({ ...form5w2h, why: e.target.value })}
  className="border p-2 rounded w-full mb-2"
/>

<input
  placeholder="Where (onde)"
  value={form5w2h.where}
  onChange={(e) => setForm5w2h({ ...form5w2h, where: e.target.value })}
  className="border p-2 rounded w-full mb-2"
/>

<input
  placeholder="When (quando)"
  value={form5w2h.when}
  onChange={(e) => setForm5w2h({ ...form5w2h, when: e.target.value })}
  className="border p-2 rounded w-full mb-2"
/>

<input
  placeholder="How (como)"
  value={form5w2h.how}
  onChange={(e) => setForm5w2h({ ...form5w2h, how: e.target.value })}
  className="border p-2 rounded w-full mb-2"
/>

<input
  placeholder="How much (custo)"
  value={form5w2h.how_much}
  onChange={(e) => setForm5w2h({ ...form5w2h, how_much: e.target.value })}
  className="border p-2 rounded w-full mb-2"
/>

{/* 👆 ATÉ AQUI */}

  <button
    onClick={saveAction}
    className="bg-green-600 text-white px-4 py-2 rounded"
  >
    + Criar ação
  </button>

  <div className="mt-4">
  {actions.map((a) => (
  <div key={a.id} className="border p-3 rounded mb-2 text-sm space-y-1">
    
    <p><strong>O que:</strong> {a.what}</p>
    <p><strong>Quem:</strong> {a.who}</p>

    {a.why && <p><strong>Por quê:</strong> {a.why}</p>}
    {a.where && <p><strong>Onde:</strong> {a.where}</p>}
    {a.when && <p><strong>Quando:</strong> {a.when}</p>}
    {a.how && <p><strong>Como:</strong> {a.how}</p>}
    {a.how_much && <p><strong>Custo:</strong> {a.how_much}</p>}

  </div>
))}
  </div>
</div>
</div>

  );
}