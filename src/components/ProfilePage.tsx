'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNotifications } from '../context/NotificationContext';
import type { Session } from '@supabase/supabase-js';

interface ProfilePageProps {
  session: Session;
  onBack: () => void;
}

interface DeadlineTask {
  task_id: string;
  task_title: string;
  due_date: string;
  project_name: string;
  days_until_due: number;
}

export default function ProfilePage({ session, onBack }: ProfilePageProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<DeadlineTask[]>([]);
  const [deadlinesLoading, setDeadlinesLoading] = useState(true);
  const { addNotification } = useNotifications();

  useEffect(() => {
    const getProfile = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', session.user.id)
        .single();
      
      if (!error && data) {
        setName(data.name || '');
      } else if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching profile:', error);
        addNotification('Error loading profile', 'error');
      }
      setLoading(false);
    };

    const getUpcomingDeadlines = async () => {
      setDeadlinesLoading(true);
      try {
        const { data, error } = await supabase
          .rpc('get_upcoming_deadlines', { user_id_param: session.user.id });
        
        if (!error && data) {
          setUpcomingDeadlines(data);
          
          // Show notification for urgent deadlines (due today or tomorrow)
          const urgentTasks = data.filter((task: DeadlineTask) => task.days_until_due <= 1);
          if (urgentTasks.length > 0) {
            const message = urgentTasks.length === 1 
              ? `"${urgentTasks[0].task_title}" is due ${urgentTasks[0].days_until_due === 0 ? 'today' : 'tomorrow'}!`
              : `You have ${urgentTasks.length} tasks due soon!`;
            addNotification(message, 'warning');
          }
        } else if (error) {
          console.error('Error fetching deadlines:', error);
        }
      } catch (error) {
        console.error('Error calling deadline function:', error);
      }
      setDeadlinesLoading(false);
    };

    getProfile();
    getUpcomingDeadlines();
  }, [session.user.id, addNotification]);

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const { error } = await supabase
      .from('profiles')
      .upsert({ 
        id: session.user.id, 
        name: name.trim(),
        email: session.user.email 
      });

    if (error) {
      addNotification('Error updating profile: ' + error.message, 'error');
    } else {
      addNotification('Profile updated successfully!', 'success');
    }
    setSaving(false);
  };

  const getDueDateColor = (daysUntilDue: number) => {
    if (daysUntilDue === 0) return 'text-red-600 bg-red-50';
    if (daysUntilDue === 1) return 'text-orange-600 bg-orange-50';
    if (daysUntilDue <= 3) return 'text-yellow-600 bg-yellow-50';
    return 'text-blue-600 bg-blue-50';
  };

  const getDueDateText = (daysUntilDue: number) => {
    if (daysUntilDue === 0) return 'Due today';
    if (daysUntilDue === 1) return 'Due tomorrow';
    return `Due in ${daysUntilDue} days`;
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={onBack} 
            className="flex items-center text-sm text-indigo-600 hover:text-indigo-800 transition-colors mb-4"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Your Profile</h1>
          <p className="text-gray-600 mt-1">Manage your account settings and view upcoming deadlines</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>
            
            <form onSubmit={updateProfile} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={session.user.email || ''}
                  disabled
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  disabled={loading || saving}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors disabled:opacity-50"
                />
              </div>
              
              <button 
                type="submit" 
                disabled={loading || saving}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving Changes...' : 'Save Changes'}
              </button>
            </form>
          </div>

          {/* Upcoming Deadlines */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Upcoming Deadlines</h2>
            
            {deadlinesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Loading deadlines...</div>
              </div>
            ) : upcomingDeadlines.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
                <p className="text-gray-600">No upcoming deadlines in the next 7 days.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingDeadlines.map((task) => (
                  <div key={task.task_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {task.task_title}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1">
                        in {task.project_name}
                      </p>
                    </div>
                    <div className={`px-2 py-1 text-xs font-medium rounded-full ${getDueDateColor(task.days_until_due)}`}>
                      {getDueDateText(task.days_until_due)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
