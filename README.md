# University Job Bank

A job posting and application platform for Acadia University, built with Next.js 14 and Supabase.

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Fill in your Supabase project credentials

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tech Stack

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **UI Components**: Shadcn/ui
- **Backend**: Supabase (Database, Auth, Storage)
- **Deployment**: Vercel

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable UI components
├── lib/                 # Utility functions and configurations
└── types/               # TypeScript type definitions
```

## Features

- University email authentication (@acadiau.ca)
- Role-based access (Faculty, Students, Admin)
- Job posting and management
- Application system with file uploads
- Real-time notifications
- Responsive design# Acadia-JobBank
