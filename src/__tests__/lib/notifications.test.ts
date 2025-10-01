import { notificationService } from '@/lib/notifications'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { beforeEach } from 'node:test'
import { describe } from 'node:test'

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  createClient: () => ({
    functions: {
      invoke: jest.fn().mockResolvedValue({ data: { success: true }, error: null })
    },
    from: jest.fn(() => ({
      insert: jest.fn(() => ({ error: null })),
      select: jest.fn(() => ({ 
        eq: jest.fn(() => ({ 
          order: jest.fn(() => ({ 
            limit: jest.fn(() => ({ data: [], error: null }))
          }))
        }))
      })),
      update: jest.fn(() => ({ 
        eq: jest.fn(() => ({ error: null }))
      })),
      delete: jest.fn(() => ({ 
        eq: jest.fn(() => ({ error: null }))
      }))
    })),
    channel: jest.fn(() => ({
      on: jest.fn(() => ({
        subscribe: jest.fn()
      }))
    }))
  })
}))

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('sendEmailNotification', () => {
    it('should send email notification successfully', async () => {
      const emailData = {
        to: 'test@acadiau.ca',
        template: 'new_job' as const,
        data: {
          studentName: 'John Doe',
          jobTitle: 'Research Assistant',
          department: 'Computer Science',
          jobType: 'research_assistant',
          description: 'Test job description',
          applicationDeadline: '2024-12-31',
          jobUrl: 'http://localhost:3000/jobs/123',
          userId: 'user-123'
        }
      }

      const result = await notificationService.sendEmailNotification(emailData)
      expect(result.success).toBe(true)
    })
  })

  describe('createNotification', () => {
    it('should create in-app notification successfully', async () => {
      const notification = {
        userId: 'user-123',
        title: 'Test Notification',
        message: 'This is a test notification',
        type: 'new_job' as const
      }

      const result = await notificationService.createNotification(notification)
      expect(result.success).toBe(true)
    })
  })

  describe('notifyApplicationReceived', () => {
    it('should send application received notification', async () => {
      const result = await notificationService.notifyApplicationReceived(
        'faculty@acadiau.ca',
        'Dr. Smith',
        'faculty-123',
        'Research Assistant Position',
        'John Doe',
        '2024-01-15T10:00:00Z',
        'http://localhost:3000/dashboard'
      )

      expect(result.success).toBe(true)
    })
  })

  describe('notifyApplicationStatusUpdate', () => {
    it('should send status update notification', async () => {
      const result = await notificationService.notifyApplicationStatusUpdate(
        'student@acadiau.ca',
        'John Doe',
        'student-123',
        'Research Assistant Position',
        'accepted',
        '2024-01-20T10:00:00Z',
        'http://localhost:3000/dashboard'
      )

      expect(result.success).toBe(true)
    })
  })

  describe('notifyNewJob', () => {
    it('should send new job notifications to multiple students', async () => {
      const students = [
        { email: 'student1@acadiau.ca', name: 'John Doe', id: 'student-1' },
        { email: 'student2@acadiau.ca', name: 'Jane Smith', id: 'student-2' }
      ]

      const result = await notificationService.notifyNewJob(
        students,
        'Research Assistant Position',
        'Computer Science',
        'research_assistant',
        'Exciting research opportunity in AI',
        '2024-12-31',
        'http://localhost:3000/jobs/123'
      )

      expect(result.success).toBe(true)
    })
  })
})