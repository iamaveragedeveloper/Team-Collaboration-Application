import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import ProjectPage from './ProjectPage';
import CreateProjectModal from './CreateProjectModal';
import type { Session } from '@supabase/supabase-js';

// ... (ProgressState and ProjectCard components remain the same) ...

interface DashboardProps {
  session: Session;
  onNavigateToProfile?: () => void;
}

export default function Dashboard({ session }: DashboardProps) {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const getProjects = useCallback(async () => {
    setLoading(true);
    const { user } = session;

    const { data, error } = await supabase
      .from('projects')
      .select('id, name, description') // Fetch description for the card
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
    } else {
      setProjects(data || []);
    }
    setLoading(false);
  }, [session]);

  useEffect(() => {
    getProjects();
  }, [getProjects]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };
  
  const handleProjectCreated = (newProject: any) => {
    setProjects([newProject, ...projects]);
  };

  if (selectedProject) {
    return <ProjectPage project={selectedProject} session={session} onBack={() => setSelectedProject(null)} />;
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
       <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500 mt-1">Your central hub for all collaborative work.</p>
        </div>
        {/* Updated "box" for buttons */}
        <div className="flex items-center space-x-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
            <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors"
            >
                + New Project
            </button>
            <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
                Logout
            </button>
        </div>
      </header>
      
      {showCreateModal && (
        <CreateProjectModal
          user={session.user}
          onClose={() => setShowCreateModal(false)}
          onProjectCreated={handleProjectCreated}
        />
      )}

      {loading ? (
        <p>Loading projects...</p>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-800">No projects yet!</h3>
            <p className="text-gray-500 mt-2">Click "New Project" to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => setSelectedProject(project)}
            />
          ))}
        </div>
      )}
    </div>
  );
}