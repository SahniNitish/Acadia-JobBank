import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BatchEmailRequest {
  recipients: Array<{
    email: string
    userId: string
    data: Record<string, any>
  }>
  template: 'application_received' | 'status_update' | 'new_job' | 'deadline_reminder'
  subject?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { recipients, template, subject }: BatchEmailRequest = await req.json()

    // Validate required fields
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0 || !template) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: recipients (array), template' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const results = []
    const errors = []

    // Process each recipient
    for (const recipient of recipients) {
      try {
        // Call the single email function
        const emailResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email-notification`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: recipient.email,
            subject: subject,
            template: template,
            data: {
              ...recipient.data,
              userId: recipient.userId
            }
          }),
        })

        if (emailResponse.ok) {
          const result = await emailResponse.json()
          results.push({
            email: recipient.email,
            success: true,
            result: result
          })
        } else {
          const errorText = await emailResponse.text()
          errors.push({
            email: recipient.email,
            error: errorText
          })
        }
      } catch (error) {
        errors.push({
          email: recipient.email,
          error: error.message
        })
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        processed: recipients.length,
        successful: results.length,
        failed: errors.length,
        results: results,
        errors: errors
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error sending batch emails:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send batch emails', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})