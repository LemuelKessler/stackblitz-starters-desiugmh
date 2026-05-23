'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ProjectPage() {
  const params = useParams();

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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">
        {project?.title || 'Carregando...'}
      </h1>

      <p>HUB: {project?.hub}</p>
    </div>
  );
}