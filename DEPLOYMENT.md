# Deployment Guide

## Vercel Deployment Setup

### Prerequisites
- Vercel account connected to your GitHub repository
- Supabase project (development and production)
- Environment variables configured

### Automatic Deployment Setup

1. **Connect Repository to Vercel**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login to Vercel
   vercel login
   
   # Link project (run in project root)
   vercel link
   ```

2. **Configure Environment Variables**
   
   Set these environment variables in Vercel dashboard or via CLI:
   
   **Production Environment:**
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL production
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
   vercel env add SUPABASE_SERVICE_ROLE_KEY production
   ```
   
   **Preview Environment:**
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL preview
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview
   vercel env add SUPABASE_SERVICE_ROLE_KEY preview
   ```

3. **Deploy to Production**
   ```bash
   # Deploy to production
   npm run deploy:production
   
   # Or deploy preview
   npm run deploy:preview
   ```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) | Yes |

### Build Configuration

The project is configured with:
- **Framework**: Next.js 14 with App Router
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Node Version**: 18.x (specified in package.json engines)
- **Region**: `iad1` (US East)

### Security Headers

The following security headers are automatically applied:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (HTTPS only)
- `Referrer-Policy: origin-when-cross-origin`

### Performance Optimizations

- **Image Optimization**: WebP and AVIF formats
- **Bundle Analysis**: Run `npm run build:analyze`
- **Compression**: Enabled for all assets
- **Package Optimization**: Optimized imports for Radix UI and Lucide React

### Monitoring and Analytics

- **Vercel Analytics**: Automatically enabled for performance monitoring
- **Error Tracking**: Built-in error boundaries and logging
- **Core Web Vitals**: Monitored via Vercel dashboard

### Deployment Workflow

1. **Development**: Push to feature branches creates preview deployments
2. **Staging**: Push to `develop` branch creates staging deployment
3. **Production**: Push to `main` branch creates production deployment

### Troubleshooting

**Build Failures:**
- Check environment variables are set correctly
- Verify Supabase connection in preview environment
- Review build logs in Vercel dashboard

**Runtime Errors:**
- Check Vercel function logs
- Verify database migrations are applied
- Ensure RLS policies are configured correctly

**Performance Issues:**
- Use Vercel Analytics to identify bottlenecks
- Run bundle analyzer: `npm run build:analyze`
- Check Core Web Vitals in Vercel dashboard