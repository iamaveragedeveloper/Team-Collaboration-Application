'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Project } from '../types';

interface Member {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  joined_at?: string;
}

interface MembersProps {
  project: Project;
}

export default function Members({ project }: MembersProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      
      // First, get the project creator
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select(`
          created_by,
          profiles:created_by(id, name, email)
        `)
        .eq('id', project.id)
        .single();

      if (projectError) {
        console.error('Error fetching project creator:', projectError);
        setLoading(false);
        return;
      }

      // For now, we'll just show the project creator as the only member
      // In a full implementation, you'd fetch from a project_members table
      const creator = projectData.profiles;
      if (creator) {
        setMembers([{
          id: creator.id,
          name: creator.name || 'Project Owner',
          email: creator.email,
          role: 'Owner',
          joined_at: new Date().toISOString()
        }]);
      }
      
      setLoading(false);
    };

    fetchMembers();
  }, [project.id]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setIsInviting(true);
    
    // For now, we'll just show a message that this feature is coming soon
    // In a full implementation, you would:
    // 1. Call a Supabase Edge Function to handle the invitation
    // 2. The function would find the user by email
    // 3. Add them to the project_members table
    // 4. Send an email notification
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      alert(`Invitation feature is coming soon! We would send an invite to ${inviteEmail}`);
      setInviteEmail('');
    } catch (error) {
      alert('Error sending invitation. Please try again.');
    } finally {
      setIsInviting(false);
    }
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return '?';
  };

  const getRoleColor = (role?: string) => {
    switch (role?.toLowerCase()) {
      case 'owner':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      case 'member':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Team Members</h3>
              <p className="text-sm text-gray-600 mt-1">
                Manage who has access to this project
              </p>
            </div>
            <div className="text-sm text-gray-500">
              {members.length} member{members.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Members List */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Loading members...</div>
            </div>
          ) : (
            <div className="space-y-4 mb-8">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-medium">
                      {getInitials(member.name, member.email)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {member.name || 'Unknown User'}
                      </div>
                      <div className="text-sm text-gray-600">{member.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(member.role)}`}>
                      {member.role || 'Member'}
                    </span>
                    {member.role !== 'Owner' && (
                      <button className="text-gray-400 hover:text-red-600 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Invite Section */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="font-medium text-gray-900 mb-4">Invite New Member</h4>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <strong>Coming Soon:</strong> Team member invitations will be available in the next update. 
                    This feature will allow you to invite users by email and manage their roles.
                  </p>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleInvite} className="flex space-x-3">
              <div className="flex-1">
                <input
                  type="email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="member@example.com"
                  disabled={isInviting}
                  required
                />
              </div>
              <button 
                type="submit" 
                className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={isInviting}
              >
                {isInviting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Inviting...
                  </span>
                ) : (
                  'Send Invite'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
