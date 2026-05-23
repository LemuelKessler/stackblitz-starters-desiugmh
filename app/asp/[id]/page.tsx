'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ASPPage({ params }: any) {
  const [project, setProject] = useState<any>(null);

  const fetchProject = async () => {
    const { data } = await supabase
      .from('asp_projects')
      .select('*')
      .eq('id', params.id)
      .single();

    setProject(data);
  };

  useEffect(() => {
    fetchProject();
  }, []);

  if (!project) return <p>Carregando...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        {project.title}
      </h1>

      <p className="mb-2">HUB: {project.hub}</p>
      <p className="mb-2">Status: {project.status}</p>
      <p className="mb-6">Causa: {project.cause}</p>

      {/* AQUI VEM AS FERRAMENTAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div className="bg-white p-4 rounded border">
          <h2 className="font-bold mb-2">Ishikawa</h2>
          <p>Em breve...</p>
        </div>

        <div className="bg-white p-4 rounded border">
          <h2 className="font-bold mb-2">5 Porquês</h2>
          <p>Em breve...</p>
        </div>

        <div className="bg-white p-4 rounded border">
          <h2 className="font-bold mb-2">5W2H</h2>
          <p>Em breve...</p>
        </div>

      </div>
    </div>
  );
}