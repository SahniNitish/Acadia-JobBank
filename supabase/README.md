# Supabase Database Setup

This directory contains the database schema and configuration for the University Job Bank application.

## Setup Instructions

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

### 2. Initialize Local Development

```bash
# Start local Supabase instance
supabase start

# Apply migrations
supabase db reset
```

### 3. Create Production Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Note down your project URL and anon key
4. Apply migrations to production:

```bash
supabase link --project-ref YOUR_PROJECT_ID
supabase db push
```

### 4. Configure Environment Variables

Create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Schema

### Tables

- **profiles**: User profiles extending Supabase auth
- **job_postings**: Faculty job postings
- **applications**: Student applications to jobs
- **notifications**: System notifications

### Storage

- **resumes**: Private bucket for resume uploads (5MB limit, PDF/DOC/DOCX only)

### Security

- Row Level Security (RLS) enabled on all tables
- Role-based access control (faculty, student, admin)
- Secure file upload policies

## Migration Files

1. `001_initial_schema.sql` - Core table structure
2. `002_indexes.sql` - Performance indexes
3. `003_triggers.sql` - Automatic timestamp updates
4. `004_auth_functions.sql` - User registration handling
5. `005_rls_policies.sql` - Row Level Security policies
6. `006_admin_policies.sql` - Admin-specific policies
7. `007_storage_setup.sql` - File storage configuration
8. `008_storage_functions.sql` - Storage helper functions

## Development

### Local Development

```bash
# Start Supabase
supabase start

# View Studio
open http://localhost:54323

# Reset database (apply all migrations)
supabase db reset

# Create new migration
supabase migration new migration_name
```

### Testing

The database includes comprehensive RLS policies that should be tested:

1. Faculty can only manage their own job postings
2. Students can only apply to active jobs
3. Users can only access their own data
4. Admins have full access for moderation

### File Upload Testing

Test file uploads with:
- Valid file types: PDF, DOC, DOCX
- File size limits: 5MB maximum
- Proper user isolation in storage paths