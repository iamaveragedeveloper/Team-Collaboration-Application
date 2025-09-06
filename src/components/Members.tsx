import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

// Define a type for what a member object looks like
interface Member {
  id: any;
  name: string | null;
  email: string | null;
  role: string;
}

export default function Members({ project }: { project: any }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  // Using useCallback to stabilize the function for useEffect
  const fetchMembers = useCallback(async () => {
    setLoading(true);

    // Fetch the project creator's details first
    const { data: creatorData, error: creatorError } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('id', project.created_by);

    if (creatorError) {
      console.error('Error fetching creator:', creatorError);
      setLoading(false);
      return;
    }

    // --- THIS IS THE FIX ---
    // creatorData is an array. We get the first element.
    const creator = creatorData && creatorData.length > 0 ? creatorData[0] : null;
    const initialMembers: Member[] = [];
    
    if (creator) {
      initialMembers.push({
        id: creator.id,
        name: creator.name || 'Project Owner',
        email: creator.email,
        role: 'Owner',
      });
    }
    
    // You can later add logic here to fetch other members from the project_members table

    setMembers(initialMembers);
    setLoading(false);
  }, [project.created_by]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);


  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    const { data, error } = await supabase.functions.invoke('invite-user', {
      body: { projectId: project.id, inviteeEmail: inviteEmail },
    });

    if (error) {
      alert(`Error inviting user: ${error.message}`);
    } else {
      alert(data.message);
      setInviteEmail('');
    }
    setIsInviting(false);
  };
  
  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
      <h3 className="text-xl font-semibold mb-4">Team Members</h3>
      {loading ? <p>Loading...</p> : (
        <ul className="space-y-2 mb-6">
          {members.map(member => (
            <li key={member.id} className="p-3 bg-gray-50 rounded flex justify-between items-center">
              <div>
                <p className="font-semibold">{member.name}</p>
                <p className="text-sm text-gray-400">{member.email}</p>
              </div>
              <span className="text-sm font-medium text-gray-600">{member.role}</span>
            </li>
          ))}
        </ul>
      )}
      
      <div className="border-t pt-4">
        <h4 className="font-semibold mb-2">Invite New Member</h4>
        <form onSubmit={handleInvite} className="flex space-x-2">
          <input
            type="email"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="member@example.com"
            required
          />
          <button type="submit" className="px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50" disabled={isInviting}>
            {isInviting ? 'Inviting...' : 'Invite'}
          </button>
        </form>
      </div>
    </div>
  );
}
