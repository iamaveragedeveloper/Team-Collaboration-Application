'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Project } from '../types';

interface Member {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
}

interface MembersProps {
  project: Project;
}

export default function Members({ project }: MembersProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  const fetchMembers = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('project_members')
      .select(`
        role,
        profiles ( id, name, email )
      `)
      .eq('project_id', project.id);

    if (error) {
      console.error('Error fetching members:', error);
      setMembers([]);
    } else {
      const formattedMembers = data.map(member => ({
        // @ts-ignore
        id: member.profiles.id,
        // @ts-ignore
        name: member.profiles.name,
        // @ts-ignore
        email: member.profiles.email,
        role: member.role,
      }));
      setMembers(formattedMembers);
    }
    setLoading(false);
  }, [project.id]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);


  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setIsInviting(true);
    const { data, error } = await supabase.functions.invoke('invite-user', {
      body: { projectId: project.id, inviteeEmail: inviteEmail.trim() },
    });

    if (error) {
      alert(`Error inviting user: ${error.message}`);
    } else {
      alert(data.message);
      setInviteEmail('');
      fetchMembers(); // Refresh the member list after a successful invite
    }
    setIsInviting(false);
  };
  
  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-xl font-semibold mb-4">Team Members ({members.length})</h3>
      {loading ? <p>Loading members...</p> : (
        <ul className="space-y-3 mb-6">
          {members.map(member => (
            <li key={member.id} className="p-4 bg-gray-50 rounded-lg flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-200 rounded-full flex items-center justify-center font-bold text-primary-700">
                  {member.name ? member.name[0].toUpperCase() : member.email ? member.email[0].toUpperCase() : '?'}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{member.name || 'No Name'}</p>
                  <p className="text-sm text-gray-500">{member.email}</p>
                </div>
              </div>
              <span className="text-sm font-medium text-gray-600 bg-gray-200 px-2 py-1 rounded-md capitalize">{member.role}</span>
            </li>
          ))}
        </ul>
      )}
      
      <div className="border-t pt-4">
        <h4 className="font-semibold mb-2">Invite New Member</h4>
        <form onSubmit={handleInvite} className="flex space-x-2">
          <input
            type="email"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="member@example.com"
            required
          />
          <button type="submit" className="px-4 py-2 text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50" disabled={isInviting || !inviteEmail.trim()}>
            {isInviting ? 'Inviting...' : 'Invite'}
          </button>
        </form>
      </div>
    </div>
  );
}