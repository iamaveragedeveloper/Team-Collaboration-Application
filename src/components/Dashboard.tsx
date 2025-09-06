import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import ProjectPage from './ProjectPage';
import CreateProjectModal from './CreateProjectModal';
import type { Session } from '@supabase/supabase-js';

// This interface defines the shape of our progress state
interface ProgressState {
  done: number;
  total: number;
  inProgress: number;
  loading: boolean;
}

// Define an interface for the Dashboard's props
interface DashboardProps {
  session: Session;
  onNavigateToProfile?: () => void; // Make this prop optional
}

const ProjectCard = ({ project, onClick }: { project: any; onClick: () => void }) => {
  // ... (rest of the ProjectCard component is unchanged)
  const [progress, setProgress] = useState<ProgressState>({
    done: 0,
    total: 0,
    inProgress: 0,
    loading: true,
  });

  useEffect(() => {
    const fetchTaskStats = async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('status')
        .eq('project_id', project.id);
      
      if (!error && data) {
        const total = data.length;
        const done = data.filter(t => t.status === 'done').length;
        const inProgress = data.filter(t => t.status === 'in_progress').length;
        setProgress({ done, total, inProgress, loading: false });
      } else {
        setProgress({ done: 0, total: 0, inProgress: 0, loading: false });
      }
    };
    fetchTaskStats();
  }, [project.id]);

  const percentage = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div onClick={onClick} className="p-6 bg-white rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow">
      <h3 className="text-lg font-semibold truncate">{project.name}</h3>
      <p className="text-sm text-gray-500 mt-2">{progress.done} of {progress.total} tasks complete</p>
      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-3">
        <div 
          className="bg-green-500 h-2.5 rounded-full" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

// Use the new DashboardProps interface here
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
      .select('id, name')
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
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6">
       <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Your Projects</h1>
        <div className="flex items-center space-x-4">
            <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
                + New Project
            </button>
            <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700"
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
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
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