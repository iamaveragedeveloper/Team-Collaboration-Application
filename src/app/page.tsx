'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import Auth from '../components/Auth';
import Dashboard from '../components/Dashboard';
import ProfilePage from '../components/ProfilePage';
import NotificationContainer from '../components/NotificationContainer';
import { NotificationProvider } from '../context/NotificationContext';
import type { Session } from '@supabase/supabase-js';

// Define a simple type for the user profile
interface Profile {
  name?: string;
  email?: string;
}

// This is the main component that controls what page is visible
export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null); // State for profile
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'profile'>('dashboard');

  useEffect(() => {
    // Check for an active session when the app loads
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for changes in authentication state (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    // Clean up the subscription when the component unmounts
    return () => subscription.unsubscribe();
  }, []);

  // New useEffect to fetch profile when session is available
  useEffect(() => {
    if (session) {
      const fetchProfile = async () => {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('name, email')
          .eq('id', session.user.id)
          .single();
        
        if (error) {
          console.error('Error fetching profile:', error);
        } else {
          setProfile(data);
        }
        setLoading(false);
      };
      fetchProfile();
    } else {
      setProfile(null); // Clear profile on logout
      setLoading(false); // Not logged in, stop loading
    }
  }, [session]);

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
        return <DashboardWithNavigation session={session} profile={profile} onNavigateToProfile={() => setCurrentPage('profile')} />;
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
  profile,
  onNavigateToProfile 
}: { 
  session: Session; 
  profile: Profile | null;
  onNavigateToProfile: () => void; 
}) => {
  const getInitial = () => {
    if (profile?.name) return profile.name[0].toUpperCase();
    if (session.user.email) return session.user.email[0].toUpperCase();
    return '?';
  };

  return (
    <div>
      <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">SynergySphere</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={onNavigateToProfile}
                className="flex items-center space-x-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="hidden sm:block font-semibold">{profile?.name || session.user.email}</span>
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {getInitial()}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </nav>
      <Dashboard key={session.user.id} session={session} profile={profile} />
    </div>
  );
}

