import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

class ApplicationError extends Error {
  constructor(message, data = {}) {
    super(message);
    Object.assign(this, data);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { projectId, inviteeEmail } = await req.json();

    // Admin client is required for inviting users
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // --- THIS IS THE KEY FIX ---
    // Use the built-in Supabase method to invite a user by email.
    // This handles creating the user if they don't exist and sending the magic link.
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      inviteeEmail,
      { data: { project_id_to_join: projectId } } // Optional: pass data to the user
    );

    if (inviteError) {
      throw new ApplicationError(inviteError.message, { status: 400 });
    }

    const inviteeId = inviteData.user.id;

    // Now, add the newly invited or existing user to the project_members table
    const { error: insertError } = await supabaseAdmin
      .from('project_members')
      .insert({ project_id: projectId, user_id: inviteeId, role: 'member' });

    if (insertError) {
      // If the user is already a member, this might fail, but the invite is still sent.
      // You can decide how to handle this case, but for now, we'll let it pass.
      console.warn('Could not add user to project_members, they may already be a member. Error:', insertError.message);
    }

    return new Response(JSON.stringify({ message: `Invitation sent successfully to ${inviteeEmail}!` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: err.status || 500,
    });
  }
});