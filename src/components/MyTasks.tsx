'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface MyTask {
  id: string;
  title: string;
  due_date: string | null;
  status: string;
  projects: {
    name: string;
  };
}

interface User {
  id: string;
  email?: string;
}

interface MyTasksProps {
  user: User;
}

export default function MyTasks({ user }: MyTasksProps) {
  const [myTasks, setMyTasks] = useState<MyTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyTasks = async () => {
      setLoading(true);
      
      // For now, we'll fetch tasks from projects where the user is the creator
      // In a full implementation, you'd also check assigned_to field
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          due_date,
          status,
          projects!inner (name, created_by)
        `)
        .eq('projects.created_by', user.id)
        .neq('status', 'done') // Only show tasks that are not done
        .order('due_date', { ascending: true, nullsFirst: false });
      
      if (error) {
        console.error("Error fetching user's tasks:", error);
        setMyTasks([]);
      } else {
        setMyTasks(data || []);
      }
      setLoading(false);
    };

    fetchMyTasks();
  }, [user.id]);

  const formatDueDate = (dateString: string | null) => {
    if (!dateString) return 'No due date';
    
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else if (diffDays <= 7) {
      return `Due in ${diffDays} days`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getDueDateColor = (dateString: string | null) => {
    if (!dateString) return 'text-gray-500';
    
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'text-red-600'; // Overdue
    if (diffDays === 0) return 'text-orange-600'; // Due today
    if (diffDays <= 3) return 'text-yellow-600'; // Due soon
    return 'text-gray-500'; // Future
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo':
        return 'bg-gray-100 text-gray-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'done':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'todo':
        return 'To Do';
      case 'in_progress':
        return 'In Progress';
      case 'done':
        return 'Done';
      default:
        return status;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">My Upcoming Tasks</h2>
            <p className="text-sm text-gray-600 mt-1">Tasks from all your projects</p>
          </div>
          <div className="text-sm text-gray-500">
            {myTasks.length} task{myTasks.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading your tasks...</div>
          </div>
        ) : myTasks.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
            <p className="text-gray-600">You have no pending tasks. Great job!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myTasks.map(task => (
              <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-medium text-gray-900 truncate">{task.title}</h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                      {getStatusLabel(task.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Project:</span> {task.projects.name}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${getDueDateColor(task.due_date)}`}>
                    {formatDueDate(task.due_date)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
