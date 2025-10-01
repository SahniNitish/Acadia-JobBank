# Quick Setup Guide - University Job Bank

## 🚀 Fast Track Deployment (15 minutes)

### Step 1: Supabase Setup (5 minutes)
1. Go to [supabase.com](https://supabase.com) → Create new project
2. Copy **Project URL** and **API Keys** from Settings → API
3. Go to **SQL Editor** → Run the database schema from `DEPLOYMENT_GUIDE.md`
4. Go to **Storage** → Create bucket named `resumes` (private)

### Step 2: Vercel Setup (5 minutes)
1. Go to [vercel.com](https://vercel.com) → Import from GitHub
2. Add environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
3. Deploy!

### Step 3: Test (5 minutes)
1. Visit your deployed app
2. Register with `@acadiau.ca` email
3. Create a job posting (faculty) or apply for one (student)

## 🛠️ Automated Setup

Run the setup script:
```bash
./scripts/setup-production.sh
```

## 📋 Essential URLs

- **Supabase Dashboard**: https://app.supabase.com
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Your App**: https://your-project.vercel.app

## 🆘 Need Help?

1. Check `DEPLOYMENT_GUIDE.md` for detailed instructions
2. Review error logs in Vercel/Supabase dashboards
3. Ensure all environment variables are set correctly

## ✅ Success Checklist

- [ ] App loads without errors
- [ ] User registration works
- [ ] Email confirmation received
- [ ] Job posting creation works
- [ ] Application submission works
- [ ] File upload works
- [ ] Notifications appear

**You're live! 🎉**