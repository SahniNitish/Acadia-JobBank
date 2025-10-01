export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export const getEmailTemplate = (template: string, data: Record<string, any>): EmailTemplate => {
  const baseUrl = Deno.env.get('SITE_URL') || 'http://localhost:3000'
  
  switch (template) {
    case 'application_received':
      return {
        subject: `New Application for ${data.jobTitle}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Application Received</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #007bff; margin-top: 0;">New Job Application Received</h2>
            </div>
            
            <p>Hello ${data.facultyName},</p>
            
            <p>You have received a new application for your job posting:</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <ul style="margin: 0; padding-left: 20px;">
                <li><strong>Job Title:</strong> ${data.jobTitle}</li>
                <li><strong>Applicant:</strong> ${data.applicantName}</li>
                <li><strong>Applied on:</strong> ${new Date(data.appliedAt).toLocaleDateString()}</li>
              </ul>
            </div>
            
            <p>You can review the application and applicant details in your dashboard.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.dashboardUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">View Application</a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #666; font-size: 14px;">
              Best regards,<br>
              Acadia University Job Bank<br>
              <a href="${baseUrl}" style="color: #007bff;">${baseUrl}</a>
            </p>
          </body>
          </html>
        `,
        text: `
New Job Application Received

Hello ${data.facultyName},

You have received a new application for your job posting:
- Job Title: ${data.jobTitle}
- Applicant: ${data.applicantName}
- Applied on: ${new Date(data.appliedAt).toLocaleDateString()}

You can review the application and applicant details in your dashboard: ${data.dashboardUrl}

Best regards,
Acadia University Job Bank
${baseUrl}
        `
      }

    case 'status_update':
      const statusColor = data.status === 'accepted' ? '#28a745' : 
                         data.status === 'rejected' ? '#dc3545' : '#ffc107'
      const statusMessage = data.status === 'accepted' ? 
        'Congratulations! Your application has been accepted.' :
        data.status === 'rejected' ?
        'Unfortunately, your application was not selected for this position.' :
        'Your application is currently under review.'

      return {
        subject: `Application Status Update: ${data.jobTitle}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Application Status Update</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #007bff; margin-top: 0;">Application Status Update</h2>
            </div>
            
            <p>Hello ${data.studentName},</p>
            
            <p>Your application status has been updated:</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <ul style="margin: 0; padding-left: 20px;">
                <li><strong>Job Title:</strong> ${data.jobTitle}</li>
                <li><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${data.status.charAt(0).toUpperCase() + data.status.slice(1)}</span></li>
                <li><strong>Updated on:</strong> ${new Date(data.updatedAt).toLocaleDateString()}</li>
              </ul>
            </div>
            
            <div style="background-color: ${statusColor}15; border-left: 4px solid ${statusColor}; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: ${statusColor}; font-weight: bold;">${statusMessage}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.dashboardUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">View Application</a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #666; font-size: 14px;">
              Best regards,<br>
              Acadia University Job Bank<br>
              <a href="${baseUrl}" style="color: #007bff;">${baseUrl}</a>
            </p>
          </body>
          </html>
        `,
        text: `
Application Status Update

Hello ${data.studentName},

Your application status has been updated:
- Job Title: ${data.jobTitle}
- Status: ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}
- Updated on: ${new Date(data.updatedAt).toLocaleDateString()}

${statusMessage}

View your application: ${data.dashboardUrl}

Best regards,
Acadia University Job Bank
${baseUrl}
        `
      }

    case 'new_job':
      return {
        subject: `New Job Opportunity: ${data.jobTitle}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Job Opportunity</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #28a745; margin-top: 0;">New Job Opportunity Available</h2>
            </div>
            
            <p>Hello ${data.studentName},</p>
            
            <p>A new job opportunity has been posted that might interest you:</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <ul style="margin: 0; padding-left: 20px;">
                <li><strong>Job Title:</strong> ${data.jobTitle}</li>
                <li><strong>Department:</strong> ${data.department}</li>
                <li><strong>Job Type:</strong> ${data.jobType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</li>
                <li><strong>Application Deadline:</strong> ${data.applicationDeadline ? new Date(data.applicationDeadline).toLocaleDateString() : 'Not specified'}</li>
              </ul>
            </div>
            
            <div style="background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Description:</strong></p>
              <p style="margin: 10px 0 0 0;">${data.description.substring(0, 300)}${data.description.length > 300 ? '...' : ''}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.jobUrl}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">View Job & Apply</a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #666; font-size: 14px;">
              Best regards,<br>
              Acadia University Job Bank<br>
              <a href="${baseUrl}" style="color: #007bff;">${baseUrl}</a>
            </p>
          </body>
          </html>
        `,
        text: `
New Job Opportunity Available

Hello ${data.studentName},

A new job opportunity has been posted that might interest you:
- Job Title: ${data.jobTitle}
- Department: ${data.department}
- Job Type: ${data.jobType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
- Application Deadline: ${data.applicationDeadline ? new Date(data.applicationDeadline).toLocaleDateString() : 'Not specified'}

Description:
${data.description.substring(0, 300)}${data.description.length > 300 ? '...' : ''}

View job and apply: ${data.jobUrl}

Best regards,
Acadia University Job Bank
${baseUrl}
        `
      }

    case 'job_alert':
      return {
        subject: `Job Alert: ${data.jobs.length} new job${data.jobs.length > 1 ? 's' : ''} matching "${data.search_name}"`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Job Alert</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #2196f3;">
              <h2 style="color: #1976d2; margin-top: 0;">🔔 Job Alert: New Opportunities Available</h2>
            </div>
            
            <p>Hello ${data.user_name},</p>
            
            <p>We found ${data.jobs.length} new job${data.jobs.length > 1 ? 's' : ''} matching your saved search "<strong>${data.search_name}</strong>":</p>
            
            <div style="margin: 20px 0;">
              ${data.jobs.map(job => `
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #007bff;">
                  <h3 style="margin: 0 0 8px 0; color: #333;">
                    <a href="${job.url}" style="color: #007bff; text-decoration: none;">${job.title}</a>
                  </h3>
                  <p style="margin: 5px 0; color: #666; font-size: 14px;">
                    <strong>Department:</strong> ${job.department} | 
                    <strong>Type:</strong> ${job.job_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    ${job.compensation ? ` | <strong>Compensation:</strong> ${job.compensation}` : ''}
                  </p>
                  ${job.application_deadline ? `
                    <p style="margin: 5px 0; color: #dc3545; font-size: 14px;">
                      <strong>Application Deadline:</strong> ${new Date(job.application_deadline).toLocaleDateString()}
                    </p>
                  ` : ''}
                  <p style="margin: 10px 0 0 0;">
                    <a href="${job.url}" style="background-color: #007bff; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-size: 14px;">
                      View & Apply
                    </a>
                  </p>
                </div>
              `).join('')}
            </div>

            <div style="background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #666;">
                💡 <strong>Tip:</strong> Apply early to increase your chances of being selected!
              </p>
            </div>

            <p style="font-size: 14px; color: #666;">
              You're receiving this email because you have job alerts enabled for the search "${data.search_name}". 
              <a href="${data.unsubscribe_url}" style="color: #007bff;">Manage your notification preferences</a>
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #666; font-size: 14px;">
              Best regards,<br>
              Acadia University Job Bank<br>
              <a href="${baseUrl}" style="color: #007bff;">${baseUrl}</a>
            </p>
          </body>
          </html>
        `,
        text: `
Job Alert: New Opportunities Available

Hello ${data.user_name},

We found ${data.jobs.length} new job${data.jobs.length > 1 ? 's' : ''} matching your saved search "${data.search_name}":

${data.jobs.map(job => `
- ${job.title}
  Department: ${job.department}
  Type: ${job.job_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
  ${job.compensation ? `Compensation: ${job.compensation}` : ''}
  ${job.application_deadline ? `Deadline: ${new Date(job.application_deadline).toLocaleDateString()}` : ''}
  Apply: ${job.url}
`).join('\n')}

You're receiving this email because you have job alerts enabled for the search "${data.search_name}".
Manage your notification preferences: ${data.unsubscribe_url}

Best regards,
Acadia University Job Bank
${baseUrl}
        `
      }

    case 'deadline_reminder':
      return {
        subject: `Reminder: Application Deadline Approaching for ${data.jobTitle}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Application Deadline Reminder</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
              <h2 style="color: #856404; margin-top: 0;">⏰ Application Deadline Reminder</h2>
            </div>
            
            <p>Hello ${data.studentName},</p>
            
            <p>This is a friendly reminder that the application deadline is approaching for a job you may be interested in:</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <ul style="margin: 0; padding-left: 20px;">
                <li><strong>Job Title:</strong> ${data.jobTitle}</li>
                <li><strong>Department:</strong> ${data.department}</li>
                <li><strong>Application Deadline:</strong> ${new Date(data.applicationDeadline).toLocaleDateString()}</li>
                <li><strong>Days Remaining:</strong> <span style="color: #dc3545; font-weight: bold;">${data.daysRemaining}</span></li>
              </ul>
            </div>
            
            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #856404; font-weight: bold;">Don't miss this opportunity!</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.jobUrl}" style="background-color: #ffc107; color: #212529; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Apply Now</a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #666; font-size: 14px;">
              Best regards,<br>
              Acadia University Job Bank<br>
              <a href="${baseUrl}" style="color: #007bff;">${baseUrl}</a>
            </p>
          </body>
          </html>
        `,
        text: `
Application Deadline Reminder

Hello ${data.studentName},

This is a friendly reminder that the application deadline is approaching for a job you may be interested in:
- Job Title: ${data.jobTitle}
- Department: ${data.department}
- Application Deadline: ${new Date(data.applicationDeadline).toLocaleDateString()}
- Days Remaining: ${data.daysRemaining}

Don't miss this opportunity!
Apply now: ${data.jobUrl}

Best regards,
Acadia University Job Bank
${baseUrl}
        `
      }

    default:
      throw new Error(`Unknown email template: ${template}`)
  }
}