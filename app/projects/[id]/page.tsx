'use client';

import { useParams } from 'next/navigation';
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
  const { id } = useParams();

  const [project, setProject] = useState<any>(null);
  const [data, setData] = useState<any[]>([]);
// ===== ISHIKAWA =====
const [ishikawa, setIshikawa] = useState<any[]>([]);
const [newItem, setNewItem] = useState('');
const [category, setCategory] = useState('Processo');

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

// salvar item
const addItem = async () => {
  if (!newItem) return;

  await supabase.from('ishikawa_items').insert([
    {
      project_id: id,
      category,
      description: newItem,
    },
  ]);

  setNewItem('');
  fetchIshikawa();
};

useEffect(() => {
  if (id) fetchIshikawa();
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

  // 🔥 PARETO
  const paretoData = Object.values(
    data.reduce((acc: any, item: any) => {
      const cause = item.root_cause || 'Sem causa';

      if (!acc[cause]) {
        acc[cause] = { cause, count: 0 };
      }

      acc[cause].count += 1;
      return acc;
    }, {})
  ).sort((a: any, b: any) => b.count - a.count);

  if (!project) return <p className="p-6">Carregando...</p>;

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold">{project.title}</h1>
        <p className="text-gray-500">HUB: {project.hub}</p>
      </div>

      {/* PARETO */}
      <div className="bg-white p-6 rounded border">
        <h2 className="font-semibold mb-4">📊 Pareto de Causas</h2>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={paretoData}>
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
          .filter((i) => i.category === cat)
          .map((item) => (
            <div
              key={item.id}
              className="text-sm bg-white text-gray-800 p-2 rounded mb-1 border"
            >
              {item.description}
            </div>
          ))}
      </div>
    ))}
  </div>
</div>
    </div>
  );
}