'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
// Import the corrected type from the central types file
import type { MyTask } from '../types';

// The local interface definition for MyTask has been removed from here.

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
      
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          due_date,
          status,
          projects ( name )
        `)
        // This query assumes tasks have an 'assignee' column, which should be 'assigned_to'
        .eq('assigned_to', user.id) 
        .neq('status', 'done')
        .order('due_date', { ascending: true, nullsFirst: false });
      
      if (error) {
        console.error("Error fetching user's tasks:", error);
        setMyTasks([]);
      } else {
        // The type assertion now works correctly because the MyTask type matches the data shape.
        setMyTasks(data as MyTask[] || []);
      }
      setLoading(false);
    };

    fetchMyTasks();
  }, [user.id]);

  const formatDueDate = (dateString: string | null) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">My Upcoming Tasks</h2>
      </div>

      <div className="p-6">
        {loading ? (
          <p>Loading your tasks...</p>
        ) : myTasks.length === 0 ? (
          <p className="text-gray-600">You have no pending tasks. Great job!</p>
        ) : (
          <div className="space-y-3">
            {myTasks.map(task => (
              <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">{task.title}</h4>
                   {/* This code now works correctly with the updated type */}
                  <p className="text-sm text-gray-600">Project: {task.projects?.name || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-700">
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