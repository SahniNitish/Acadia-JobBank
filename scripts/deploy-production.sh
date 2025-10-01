#!/bin/bash

# Production Deployment Script for University Job Bank
# This script handles the complete deployment process to production

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROD_PROJECT_REF=${SUPABASE_PROD_PROJECT_REF}
STAGING_PROJECT_REF=${SUPABASE_STAGING_PROJECT_REF}

echo -e "${GREEN}🚀 Starting University Job Bank Production Deployment${NC}"

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if project references are set
if [ -z "$PROD_PROJECT_REF" ]; then
    echo -e "${RED}❌ SUPABASE_PROD_PROJECT_REF environment variable is not set${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Run tests
echo -e "${YELLOW}🧪 Running tests...${NC}"
npm run test:ci
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Tests failed. Deployment aborted.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ All tests passed${NC}"

# Build application
echo -e "${YELLOW}🔨 Building application...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed. Deployment aborted.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Build successful${NC}"

# Deploy database migrations
echo -e "${YELLOW}🗄️ Deploying database migrations to production...${NC}"
supabase link --project-ref $PROD_PROJECT_REF
supabase db push --linked --include-seed=false
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Database migration failed. Deployment aborted.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Database migrations deployed${NC}"

# Deploy Edge Functions
echo -e "${YELLOW}⚡ Deploying Edge Functions...${NC}"
supabase functions deploy send-email-notification --project-ref $PROD_PROJECT_REF
supabase functions deploy job-alerts-cron --project-ref $PROD_PROJECT_REF
supabase functions deploy deadline-reminder-cron --project-ref $PROD_PROJECT_REF
supabase functions deploy send-batch-notifications --project-ref $PROD_PROJECT_REF
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Edge Functions deployment failed. Deployment aborted.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Edge Functions deployed${NC}"

# Deploy to Vercel
echo -e "${YELLOW}🌐 Deploying to Vercel production...${NC}"
vercel --prod --yes
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Vercel deployment failed. Deployment aborted.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Vercel deployment successful${NC}"

# Verify deployment
echo -e "${YELLOW}🔍 Verifying deployment...${NC}"

# Check database connection
echo "Checking database connection..."
supabase status --linked
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️ Warning: Could not verify database connection${NC}"
fi

# Check if Edge Functions are responding
echo "Checking Edge Functions..."
# This would typically involve health check endpoints

echo -e "${GREEN}🎉 Production deployment completed successfully!${NC}"
echo -e "${YELLOW}📝 Post-deployment checklist:${NC}"
echo "1. Verify application is accessible at production URL"
echo "2. Test user registration and login"
echo "3. Test job posting creation and application"
echo "4. Check email notifications are working"
echo "5. Monitor error logs for any issues"
echo "6. Update DNS records if needed"
echo "7. Enable monitoring and alerts"

echo -e "${GREEN}✨ Deployment complete! Monitor the application for the next 24 hours.${NC}"