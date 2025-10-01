import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Get jobs with deadlines in the next 3 days
    const threeDaysFromNow = new Date()
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

    const { data: jobsWithDeadlines, error: jobsError } = await supabaseClient
      .from('job_postings')
      .select(`
        id,
        title,
        department,
        application_deadline,
        posted_by,
        profiles!job_postings_posted_by_fkey (
          full_name,
          email
        )
      `)
      .eq('is_active', true)
      .not('application_deadline', 'is', null)
      .lte('application_deadline', threeDaysFromNow.toISOString().split('T')[0])
      .gte('application_deadline', new Date().toISOString().split('T')[0])

    if (jobsError) {
      throw new Error(`Failed to fetch jobs: ${jobsError.message}`)
    }

    if (!jobsWithDeadlines || jobsWithDeadlines.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No jobs with approaching deadlines found',
          processed: 0
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    let totalNotificationsSent = 0

    // For each job, find students who might be interested but haven't applied
    for (const job of jobsWithDeadlines) {
      try {
        // Get students who haven't applied to this job
        const { data: potentialApplicants, error: studentsError } = await supabaseClient
          .from('profiles')
          .select('id, email, full_name, department')
          .eq('role', 'student')
          .not('id', 'in', `(
            SELECT applicant_id 
            FROM applications 
            WHERE job_id = '${job.id}'
          )`)

        if (studentsError) {
          console.error(`Error fetching students for job ${job.id}:`, studentsError)
          continue
        }

        if (!potentialApplicants || potentialApplicants.length === 0) {
          continue
        }

        // Calculate days remaining
        const deadline = new Date(job.application_deadline)
        const today = new Date()
        const daysRemaining = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

        // Prepare batch notification data
        const recipients = potentialApplicants.map(student => ({
          email: student.email,
          userId: student.id,
          data: {
            studentName: student.full_name,
            jobTitle: job.title,
            department: job.department,
            applicationDeadline: job.application_deadline,
            daysRemaining: daysRemaining,
            jobUrl: `${Deno.env.get('SITE_URL')}/jobs/${job.id}`,
            userId: student.id
          }
        }))

        // Send batch notifications
        const batchResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-batch-notifications`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipients: recipients,
            template: 'deadline_reminder',
            subject: `Reminder: Application Deadline Approaching for ${job.title}`
          }),
        })

        if (batchResponse.ok) {
          const result = await batchResponse.json()
          totalNotificationsSent += result.successful || 0
          console.log(`Sent ${result.successful} deadline reminders for job: ${job.title}`)
        } else {
          console.error(`Failed to send deadline reminders for job ${job.id}`)
        }

      } catch (error) {
        console.error(`Error processing job ${job.id}:`, error)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Deadline reminders processed successfully',
        jobsProcessed: jobsWithDeadlines.length,
        notificationsSent: totalNotificationsSent
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in deadline reminder cron:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process deadline reminders', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})