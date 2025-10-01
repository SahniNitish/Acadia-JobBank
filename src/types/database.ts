export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'faculty' | 'student' | 'admin';
  department?: string;
  year_of_study?: number; // for students only
  created_at: string;
  updated_at: string;
}

export interface JobPosting {
  id: string;
  title: string;
  description: string;
  requirements?: string;
  compensation?: string;
  job_type: 'research_assistant' | 'teaching_assistant' | 'work_study' | 'internship' | 'other';
  department: string;
  duration?: string;
  application_deadline?: string;
  is_active: boolean;
  posted_by: string;
  created_at: string;
  updated_at: string;
  application_count?: number;
}

export interface Application {
  id: string;
  job_id: string;
  applicant_id: string;
  cover_letter: string;
  resume_url?: string;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  applied_at: string;
  updated_at: string;
  applicant?: Profile;
  job_posting?: JobPosting;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'application_received' | 'status_update' | 'new_job' | 'deadline_reminder';
  read: boolean;
  created_at: string;
}

export interface SavedSearch {
  id: string;
  user_id: string;
  name: string;
  search_criteria: {
    search?: string;
    department?: string;
    job_type?: JobPosting['job_type'];
    deadline_from?: string;
    deadline_to?: string;
    sort_by?: string;
    sort_order?: string;
  };
  is_alert_enabled: boolean;
  alert_frequency: 'immediate' | 'daily' | 'weekly';
  last_alert_sent?: string;
  created_at: string;
  updated_at: string;
}

export interface SearchHistory {
  id: string;
  user_id: string;
  search_query: string;
  search_filters?: {
    department?: string;
    job_type?: string;
    deadline_from?: string;
    deadline_to?: string;
  };
  results_count: number;
  searched_at: string;
}

export interface JobRecommendation {
  id: string;
  user_id: string;
  job_id: string;
  recommendation_score: number;
  recommendation_reason?: string;
  created_at: string;
  job_posting?: JobPosting;
}