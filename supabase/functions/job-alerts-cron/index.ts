import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get all saved searches with alerts enabled
    const { data: savedSearches, error: searchError } = await supabase
      .from('saved_searches')
      .select(`
        *,
        profiles!saved_searches_user_id_fkey (
          id,
          email,
          full_name
        )
      `)
      .eq('is_alert_enabled', true)

    if (searchError) {
      throw searchError
    }

    const now = new Date()
    const alertsSent = []

    for (const savedSearch of savedSearches || []) {
      // Check if we should send an alert based on frequency
      const shouldSendAlert = checkAlertFrequency(savedSearch, now)
      
      if (!shouldSendAlert) {
        continue
      }

      try {
        // Build job query based on saved search criteria
        let jobQuery = supabase
          .from('job_postings')
          .select('*')
          .eq('is_active', true)

        const criteria = savedSearch.search_criteria

        if (criteria.search) {
          jobQuery = jobQuery.or(`title.ilike.%${criteria.search}%,description.ilike.%${criteria.search}%`)
        }

        if (criteria.department) {
          jobQuery = jobQuery.eq('department', criteria.department)
        }

        if (criteria.job_type) {
          jobQuery = jobQuery.eq('job_type', criteria.job_type)
        }

        if (criteria.deadline_from) {
          jobQuery = jobQuery.gte('application_deadline', criteria.deadline_from)
        }

        if (criteria.deadline_to) {
          jobQuery = jobQuery.lte('application_deadline', criteria.deadline_to)
        }

        // Only get jobs created since last alert or in the last day for new searches
        const lastAlertDate = savedSearch.last_alert_sent 
          ? new Date(savedSearch.last_alert_sent)
          : new Date(now.getTime() - 24 * 60 * 60 * 1000) // 24 hours ago

        jobQuery = jobQuery.gte('created_at', lastAlertDate.toISOString())

        const { data: newJobs, error: jobError } = await jobQuery
          .order('created_at', { ascending: false })
          .limit(10)

        if (jobError) {
          console.error('Error fetching jobs for alert:', jobError)
          continue
        }

        if (!newJobs || newJobs.length === 0) {
          // Update last alert sent even if no new jobs
          await supabase
            .from('saved_searches')
            .update({ 
              last_alert_sent: now.toISOString(),
              updated_at: now.toISOString()
            })
            .eq('id', savedSearch.id)
          continue
        }

        // Send email notification
        const { error: emailError } = await supabase.functions.invoke('send-email-notification', {
          body: {
            to: savedSearch.profiles.email,
            subject: `New Job Alert: ${newJobs.length} new job${newJobs.length > 1 ? 's' : ''} matching "${savedSearch.name}"`,
            template: 'job_alert',
            data: {
              user_name: savedSearch.profiles.full_name,
              search_name: savedSearch.name,
              jobs: newJobs.map(job => ({
                title: job.title,
                department: job.department,
                job_type: job.job_type,
                compensation: job.compensation,
                application_deadline: job.application_deadline,
                url: `${Deno.env.get('SITE_URL')}/jobs/${job.id}`
              })),
              unsubscribe_url: `${Deno.env.get('SITE_URL')}/profile/notifications`
            }
          }
        })

        if (emailError) {
          console.error('Error sending job alert email:', emailError)
          continue
        }

        // Update last alert sent timestamp
        await supabase
          .from('saved_searches')
          .update({ 
            last_alert_sent: now.toISOString(),
            updated_at: now.toISOString()
          })
          .eq('id', savedSearch.id)

        alertsSent.push({
          searchId: savedSearch.id,
          searchName: savedSearch.name,
          userEmail: savedSearch.profiles.email,
          jobCount: newJobs.length
        })

      } catch (error) {
        console.error(`Error processing alert for search ${savedSearch.id}:`, error)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${savedSearches?.length || 0} saved searches, sent ${alertsSent.length} alerts`,
        alertsSent
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Job alerts cron error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

function checkAlertFrequency(savedSearch: any, now: Date): boolean {
  const lastAlertSent = savedSearch.last_alert_sent ? new Date(savedSearch.last_alert_sent) : null
  
  if (!lastAlertSent) {
    return true // First time sending alert
  }

  const timeDiff = now.getTime() - lastAlertSent.getTime()
  const hoursDiff = timeDiff / (1000 * 60 * 60)

  switch (savedSearch.alert_frequency) {
    case 'immediate':
      return hoursDiff >= 1 // At least 1 hour between immediate alerts
    case 'daily':
      return hoursDiff >= 24
    case 'weekly':
      return hoursDiff >= 168 // 24 * 7
    default:
      return false
  }
}