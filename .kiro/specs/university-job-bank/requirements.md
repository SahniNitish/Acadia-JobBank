# Requirements Document

## Introduction

The University Job Bank is a web-based platform designed specifically for Acadia University to facilitate job postings and applications between faculty members and students. The system will allow faculty to post various types of job opportunities (research assistant positions, teaching assistant roles, work-study jobs, etc.) while providing students with a centralized location to discover and apply for these positions. The platform aims to streamline the hiring process within the university ecosystem and improve job visibility for students.

## Technical Stack

The platform will be built using:
- **Frontend**: Modern web application deployed on Vercel for fast, reliable hosting
- **Backend**: Supabase for database, authentication, and real-time features
- **Authentication**: Supabase Auth with university email domain restrictions
- **File Storage**: Supabase Storage for resume uploads
- **Email Notifications**: Supabase Edge Functions for automated email delivery

This stack ensures the application can be immediately deployed and demonstrated to faculty upon completion.

## Requirements

### Requirement 1

**User Story:** As a faculty member, I want to create and post job listings, so that I can find qualified students for available positions.

#### Acceptance Criteria

1. WHEN a faculty member accesses the job posting form THEN the system SHALL display fields for job title, description, requirements, compensation, duration, and application deadline
2. WHEN a faculty member submits a complete job posting THEN the system SHALL save the posting and make it visible to students
3. WHEN a faculty member creates a job posting THEN the system SHALL require authentication with university credentials
4. IF a required field is missing THEN the system SHALL display validation errors and prevent submission
5. WHEN a job posting is created THEN the system SHALL automatically associate it with the posting faculty member's profile

### Requirement 2

**User Story:** As a student, I want to browse and search available job postings, so that I can find opportunities that match my skills and interests.

#### Acceptance Criteria

1. WHEN a student accesses the job board THEN the system SHALL display all active job postings in a searchable list
2. WHEN a student uses the search function THEN the system SHALL filter jobs by keywords, department, job type, and compensation range
3. WHEN a student views a job posting THEN the system SHALL display all job details including requirements, compensation, and application instructions
4. WHEN a student accesses the platform THEN the system SHALL require authentication with university credentials
5. IF no jobs match search criteria THEN the system SHALL display an appropriate message

### Requirement 3

**User Story:** As a student, I want to apply for job postings directly through the platform, so that I can submit my application materials efficiently.

#### Acceptance Criteria

1. WHEN a student clicks apply on a job posting THEN the system SHALL display an application form
2. WHEN a student submits an application THEN the system SHALL require a cover letter and allow resume upload
3. WHEN an application is submitted THEN the system SHALL notify the posting faculty member via email
4. WHEN a student applies for a job THEN the system SHALL prevent duplicate applications for the same posting
5. IF the application deadline has passed THEN the system SHALL prevent new applications

### Requirement 4

**User Story:** As a faculty member, I want to manage applications for my job postings, so that I can review candidates and make hiring decisions.

#### Acceptance Criteria

1. WHEN a faculty member accesses their dashboard THEN the system SHALL display all their job postings and application counts
2. WHEN a faculty member views applications for a posting THEN the system SHALL display applicant information, cover letters, and resumes
3. WHEN a faculty member updates an application status THEN the system SHALL notify the student via email
4. WHEN a faculty member marks a position as filled THEN the system SHALL automatically close the posting to new applications
5. IF a faculty member deletes a job posting THEN the system SHALL archive it and notify all applicants

### Requirement 5

**User Story:** As a system administrator, I want to manage user accounts and platform settings, so that I can maintain the platform's integrity and functionality.

#### Acceptance Criteria

1. WHEN an administrator accesses the admin panel THEN the system SHALL display user management and platform statistics
2. WHEN an administrator deactivates a user account THEN the system SHALL prevent login and hide associated content
3. WHEN an administrator reviews reported content THEN the system SHALL provide moderation tools to edit or remove inappropriate postings
4. WHEN the system detects suspicious activity THEN it SHALL log the activity and alert administrators
5. IF a user violates platform policies THEN the system SHALL allow administrators to suspend or ban the account

### Requirement 6

**User Story:** As a user (faculty or student), I want to receive notifications about relevant activities, so that I can stay informed about application status and new opportunities.

#### Acceptance Criteria

1. WHEN a new job is posted in a student's area of interest THEN the system SHALL send an email notification
2. WHEN an application status changes THEN the system SHALL notify the applicant via email
3. WHEN a faculty member receives a new application THEN the system SHALL send an immediate email notification
4. WHEN a job posting deadline approaches THEN the system SHALL remind interested students who haven't applied
5. IF a user opts out of notifications THEN the system SHALL respect their preference and stop sending emails