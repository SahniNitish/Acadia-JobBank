import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { getEmailTemplate } from '../_shared/email-templates.ts'

interface EmailRequest {
  to: string
  subject?: string
  template: 'application_received' | 'status_update' | 'new_job' | 'deadline_reminder'
  data: Record<string, any>
}

serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { to, subject, template, data }: EmailRequest = await req.json()

    // Validate required fields
    if (!to || !template || !data) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, template, data' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get email template
    const emailTemplate = getEmailTemplate(template, data)

    // Send email using Resend (you'll need to configure this)
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set')
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Acadia Job Bank <noreply@acadiau.ca>',
        to: [to],
        subject: subject || emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      }),
    })

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text()
      throw new Error(`Failed to send email: ${errorText}`)
    }

    const emailResult = await emailResponse.json()

    // Log the notification in the database
    const { error: dbError } = await supabaseClient
      .from('notifications')
      .insert({
        user_id: data.userId,
        title: subject || emailTemplate.subject,
        message: emailTemplate.text.substring(0, 500),
        type: template,
        read: false
      })

    if (dbError) {
      console.error('Failed to log notification:', dbError)
      // Don't fail the email send if logging fails
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        emailId: emailResult.id 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error sending email:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send email', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})