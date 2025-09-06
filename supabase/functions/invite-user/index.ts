import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Define standard CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define a custom error class
class ApplicationError extends Error {
  constructor(message, data = {}) {
    super(message);
    Object.assign(this, data);
  }
}

Deno.serve(async (req) => {
  // This is needed for CORS preflight requests.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { projectId, inviteeEmail } = await req.json();

    // Create a Supabase client with the service_role key to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Find the user to invite by their email
    const { data: invitee, error: inviteeError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', inviteeEmail)
      .single();

    if (inviteeError || !invitee) {
      throw new ApplicationError("User not found.", { status: 404 });
    }

    // 2. Check if the user is already a member
    const { data: existingMember } = await supabaseAdmin
      .from('project_members')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', invitee.id)
      .maybeSingle();

    if (existingMember) {
      throw new ApplicationError("User is already a member of this project.", { status: 409 });
    }

    // 3. Add the user to the project_members table
    const { error: insertError } = await supabaseAdmin
      .from('project_members')
      .insert({ project_id: projectId, user_id: invitee.id, role: 'member' });

    if (insertError) {
      throw insertError;
    }

    return new Response(JSON.stringify({ message: "User invited successfully!" }), {
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