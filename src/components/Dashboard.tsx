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
  
  const getProgressColor = () => {
    if (percentage >= 100) return 'bg-success-500';
    if (percentage >= 75) return 'bg-primary-500';
    if (percentage >= 50) return 'bg-warning-500';
    if (percentage >= 25) return 'bg-warning-400';
    return 'bg-gray-400';
  };

  const getStatusBadge = () => {
    if (percentage >= 100) return { color: 'bg-success-100 text-success-800', label: 'Complete' };
    if (percentage >= 75) return { color: 'bg-primary-100 text-primary-800', label: 'Active' };
    if (percentage >= 25) return { color: 'bg-warning-100 text-warning-800', label: 'In Progress' };
    return { color: 'bg-gray-100 text-gray-800', label: 'Planning' };
  };

  const statusBadge = getStatusBadge();

  return (
    <div 
      onClick={onClick} 
      className="group flex flex-col justify-between p-5 bg-white rounded-xl shadow-sm border border-gray-200 cursor-pointer hover:border-primary-300 hover:shadow-lg transition-all duration-200"
    >
      {/* Header Section */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-gray-800 group-hover:text-primary-600 transition-colors truncate mb-1">
            {project.name}
          </h3>
          <p className="text-sm text-gray-500 line-clamp-2 h-10 leading-5">
            {project.description || 'No description provided.'}
          </p>
        </div>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusBadge.color} ml-3 flex-shrink-0`}>
          {statusBadge.label}
        </span>
      </div>

      {/* Progress Section */}
      <div className="mt-auto">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-medium text-gray-600">
            {progress.loading ? 'Loading...' : `${progress.done} of ${progress.total} tasks completed`}
          </span>
          <span className="text-xs font-bold text-gray-700">{percentage}%</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ease-out ${getProgressColor()}`} 
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Task breakdown with modern styling */}
        {!progress.loading && progress.total > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-gray-600">{progress.total - progress.done - progress.inProgress}</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-primary-400 rounded-full"></div>
                <span className="text-gray-600">{progress.inProgress}</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-success-400 rounded-full"></div>
                <span className="text-gray-600">{progress.done}</span>
              </div>
            </div>
            <div className="text-gray-400 group-hover:text-primary-500 transition-colors">
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        )}

        {progress.total === 0 && !progress.loading && (
          <div className="text-center py-2">
            <span className="text-xs text-gray-500">No tasks yet</span>
          </div>
        )}
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
                className="btn-primary"
            >
                + New Project
            </button>
            <button
                onClick={handleLogout}
                className="btn-secondary"
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