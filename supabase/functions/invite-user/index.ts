import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { projectId, inviteeEmail } = await req.json()
    if (!projectId || !inviteeEmail) throw new Error('Project ID and email are required.')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Step 1: Invite the user via Supabase Auth to send the email.
    await supabaseAdmin.auth.admin.inviteUserByEmail(inviteeEmail)

    // Step 2: Get the invited user's ID.
    const { data: userData, error: userError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', inviteeEmail)
        .single()
    if (userError) throw new Error('Could not find the invited user profile.')
    const userId = userData.id

    // Step 3: Check if they are already a member of this project.
    const { data: existingMember } = await supabaseAdmin
        .from('project_members')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .maybeSingle()

    if (existingMember) {
        throw new Error('This user is already a member of the project.')
    }

    // Step 4: Add the user to the project_members table.
    const { error: insertError } = await supabaseAdmin
        .from('project_members')
        .insert({ project_id: projectId, user_id: userId, role: 'member' })
    if (insertError) throw new Error(`DB Error: ${insertError.message}`)

    return new Response(
      JSON.stringify({ message: `Successfully invited ${inviteeEmail}!` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})