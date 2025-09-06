import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { projectId, inviteeEmail } = await req.json()

    if (!projectId || !inviteeEmail) {
      throw new Error('Project ID and invitee email are required.')
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Step 1: Invite the user. This sends the email and creates an auth user if one doesn't exist.
    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      inviteeEmail
    )
    // We can ignore the "User already invited" error, as our goal is just to add them to the project.
    // For any other invite error, we should stop.
    if (inviteError && !inviteError.message.includes('User already invited')) {
        throw inviteError
    }

    // Step 2: Get the user's ID (they are guaranteed to exist in auth.users now)
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', inviteeEmail)
      .single()

    if (userError) throw new Error('Could not retrieve user data after invitation.')
    const userId = userData.id

    // Step 3: Check if the user is ALREADY a member of this project
    const { data: existingMember } = await supabaseAdmin
      .from('project_members')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .maybeSingle() // Use .maybeSingle() as they might not be a member yet.

    if (existingMember) {
      throw new Error('This user is already a member of the project.')
    }

    // Step 4: If not a member, add them to the project
    const { error: insertError } = await supabaseAdmin
      .from('project_members')
      .insert({ project_id: projectId, user_id: userId, role: 'member' })

    if (insertError) throw insertError

    // Step 5: Return a success response
    return new Response(
      JSON.stringify({ message: `Successfully invited ${inviteeEmail} to the project!` }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400, // Use 400 for client-side errors (e.g., user already exists)
    })
  }
})