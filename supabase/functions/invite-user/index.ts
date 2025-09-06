import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { projectId, inviteeEmail } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Step 1: Get the user ID from the email
    const { data: userData, error: userError } = await supabaseAdmin.from('users').select('id').eq('email', inviteeEmail).single();

    let userId;
    // If user does not exist, invite them. This will create a user and send an email.
    if (userError || !userData) {
        const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(inviteeEmail);
        if (inviteError) throw new Error(`Error inviting user: ${inviteError.message}`);
        userId = inviteData.user.id;
    } else {
        userId = userData.id;
    }

    // Step 2: Check if the user is already a member of the project
    const { data: memberData, error: memberError } = await supabaseAdmin
      .from('project_members')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single();

    if (memberData) {
      throw new Error('User is already a member of this project.');
    }

    // Step 3: If not a member, add them to the project_members table
    const { error: insertError } = await supabaseAdmin
      .from('project_members')
      .insert({ project_id: projectId, user_id: userId, role: 'member' });

    if (insertError) {
      throw new Error(`Failed to add user to project: ${insertError.message}`);
    }

    return new Response(JSON.stringify({ message: `Successfully invited ${inviteeEmail} to the project!` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    return new Response