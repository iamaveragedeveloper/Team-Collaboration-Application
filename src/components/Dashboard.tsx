'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import ProjectPage from './ProjectPage';
import CreateProjectModal from './CreateProjectModal';
import MyTasks from './MyTasks';
import type { Session } from '@supabase/supabase-js';
import type { Project } from '../types';

// Enhanced ProjectCard component with progress visualization
const ProjectCard = ({ project, onClick }: { project: Project; onClick: () => void }) => {
  const [progress, setProgress] = useState({ done: 0, total: 0, loading: true });

  useEffect(() => {
    // Fetch task counts for this specific project
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
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-blue-500';
    if (percentage >= 25) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  const getStatusColor = () => {
    if (percentage === 100) return 'bg-green-100 text-green-800';
    if (progress.inProgress > 0) return 'bg-blue-100 text-blue-800';
    if (progress.total > 0) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div 
      onClick={onClick} 
      className="group p-6 bg-white rounded-xl shadow-sm border border-gray-200 cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
            {project.name}
          </h3>
          {project.description && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {project.description}
            </p>
          )}
        </div>
        <div className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor()}`}>
          {percentage === 100 ? 'Complete' : progress.inProgress > 0 ? 'Active' : progress.total > 0 ? 'Planning' : 'New'}
        </div>
      </div>

      {/* Progress Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            {progress.loading ? 'Loading...' : `${progress.done} of ${progress.total} tasks complete`}
          </span>
          <span className="font-medium text-gray-900">{percentage}%</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        {/* Task breakdown */}
        {!progress.loading && progress.total > 0 && (
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span>{progress.total - progress.done - (progress.inProgress || 0)} todo</span>
            </div>
            {progress.inProgress > 0 && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>{progress.inProgress} in progress</span>
              </div>
            )}
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>{progress.done} done</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface DashboardProps {
  session: Session;
}

export default function Dashboard({ session }: DashboardProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Function to fetch projects
  const getProjects = async () => {
    setLoading(true);
    const { user } = session;

    const { data, error } = await supabase
      .from('projects')
      .select('id, name, description, created_by, created_at')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false }); // Show newest first

    if (error) {
      console.error('Error fetching projects:', error);
    } else {
      setProjects(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    getProjects();
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };
  
  // Callback to add the new project to the list without a full refresh
  const handleProjectCreated = (newProject: Project) => {
    setProjects([newProject, ...projects]);
  };
  
  // If a project is selected, show the ProjectPage. Otherwise, show the project list.
  if (selectedProject) {
    return <ProjectPage project={selectedProject} session={session} onBack={() => setSelectedProject(null)} />;
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Projects</h1>
            <p className="text-gray-600 mt-1">Manage and collaborate on your team projects</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>New Project</span>
            </button>
          </div>
        </header>
        
        {/* Conditionally render the modal */}
        {showCreateModal && (
          <CreateProjectModal
            user={session.user}
            onClose={() => setShowCreateModal(false)}
            onProjectCreated={handleProjectCreated}
          />
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-lg text-gray-600">Loading projects...</div>
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

        {projects.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-600 mb-6">Get started by creating your first project</p>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Create Project
            </button>
          </div>
        )}

        {/* My Tasks Section */}
        <MyTasks user={session.user} />
      </div>
  );
}
