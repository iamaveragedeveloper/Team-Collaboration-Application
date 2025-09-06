'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import ProjectPage from './ProjectPage';
import CreateProjectModal from './CreateProjectModal';
import type { Session } from '@supabase/supabase-js';

// Define ProgressState interface
interface ProgressState {
  done: number;
  total: number;
  inProgress: number;
  loading: boolean;
}

// The ProjectCard component needs to be defined here, in the same file as Dashboard
const ProjectCard = ({ project, onClick }: { project: any; onClick: () => void }) => {
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
    <div 
      onClick={onClick} 
      className="group flex flex-col justify-between p-5 bg-white rounded-xl shadow-sm border border-gray-200 cursor-pointer hover:border-primary-500 hover:shadow-lg transition-all duration-200"
    >
      <div>
        <h3 className="text-base font-bold text-gray-800 group-hover:text-primary-600 truncate">{project.name}</h3>
        <p className="text-sm text-gray-500 mt-2 h-10 overflow-hidden">
          {project.description || 'No description provided.'}
        </p>
      </div>

      <div className="mt-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-medium text-gray-500">{progress.done} of {progress.total} tasks done</span>
          <span className="text-xs font-bold text-gray-600">{percentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary-500 h-2 rounded-full transition-all duration-500" 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};


// Define props interface for Dashboard
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
      .select('id, name, description')
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
        <div className="text-center py-16"><p>Loading projects...</p></div>
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