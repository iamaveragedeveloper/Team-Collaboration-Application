'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import Auth from '../components/Auth';
import Dashboard from '../components/Dashboard';
import ProfilePage from '../components/ProfilePage';
import NotificationContainer from '../components/NotificationContainer';
import { NotificationProvider } from '../context/NotificationContext';
import type { Session } from '@supabase/supabase-js';

// This is the main component that controls what page is visible
export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'profile'>('dashboard');

  useEffect(() => {
    // Check for an active session when the app loads
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for changes in authentication state (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    // Clean up the subscription when the component unmounts
    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const renderCurrentPage = () => {
    if (!session) {
      return <Auth />;
    }

    // Navigation logic based on the currentPage state
    switch (currentPage) {
      case 'profile':
        return <ProfilePage session={session} onBack={() => setCurrentPage('dashboard')} />;
      case 'dashboard':
      default:
        // The Dashboard is wrapped to include top navigation
        return <DashboardWithNavigation session={session} onNavigateToProfile={() => setCurrentPage('profile')} />;
    }
  };

  return (
    <NotificationProvider>
      {renderCurrentPage()}
      <NotificationContainer />
    </NotificationProvider>
  );
}

// This wrapper adds the navigation bar above the main Dashboard component
const DashboardWithNavigation = ({ 
  session, 
  onNavigateToProfile 
}: { 
  session: Session; 
  onNavigateToProfile: () => void; 
}) => {
  return (
    <div>
      <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">SynergySphere</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={onNavigateToProfile}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-white">
                    {session.user.email?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
                <span className="hidden sm:block">Profile</span>
              </button>
            </div>
          </div>
        </div>
      </nav>
      <Dashboard key={session.user.id} session={session} />
    </div>
  );
}
