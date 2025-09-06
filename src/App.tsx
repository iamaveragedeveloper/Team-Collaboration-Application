import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Auth from '@/components/Auth';
import Dashboard from '@/components/Dashboard';
import ProfilePage from '@/components/ProfilePage';
import NotificationContainer from '@/components/NotificationContainer';
import { NotificationProvider } from '@/context/NotificationContext';
import type { Session } from '@supabase/supabase-js';

// Define a simple type for the user profile
interface Profile {
  name?: string;
  email?: string;
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null); // State for profile
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'profile'>('dashboard');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

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
      setProfile(null);
      setLoading(false);
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

    switch (currentPage) {
      case 'profile':
        return <ProfilePage session={session} onBack={() => setCurrentPage('dashboard')} />;
      case 'dashboard':
      default:
        // Pass the profile prop to the Dashboard component
        return <Dashboard session={session} profile={profile} onNavigateToProfile={() => setCurrentPage('profile')} />;
    }
  };

  return (
    <NotificationProvider>
      <div className="min-h-screen bg-gray-50">
        {renderCurrentPage()}
      </div>
      <NotificationContainer />
    </NotificationProvider>
  );
}

