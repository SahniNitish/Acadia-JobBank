#!/bin/bash

# University Job Bank - Production Setup Script
# This script helps automate the production setup process

set -e

echo "🚀 University Job Bank - Production Setup"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_header() {
    echo -e "\n${BLUE}$1${NC}"
    echo "----------------------------------------"
}

# Check if required tools are installed
check_requirements() {
    print_header "Checking Requirements"
    
    # Check Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js is installed: $NODE_VERSION"
    else
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    # Check npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_success "npm is installed: $NPM_VERSION"
    else
        print_error "npm is not installed."
        exit 1
    fi
    
    # Check git
    if command -v git &> /dev/null; then
        print_success "Git is installed"
    else
        print_error "Git is not installed. Please install Git first."
        exit 1
    fi
    
    # Check if Supabase CLI is installed
    if command -v supabase &> /dev/null; then
        print_success "Supabase CLI is installed"
    else
        print_warning "Supabase CLI is not installed. Installing..."
        npm install -g supabase
        print_success "Supabase CLI installed"
    fi
}

# Install dependencies
install_dependencies() {
    print_header "Installing Dependencies"
    
    if [ -f "package.json" ]; then
        print_info "Installing npm dependencies..."
        npm install
        print_success "Dependencies installed"
    else
        print_error "package.json not found. Are you in the correct directory?"
        exit 1
    fi
}

# Setup environment variables
setup_environment() {
    print_header "Setting Up Environment Variables"
    
    if [ ! -f ".env.local" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env.local
            print_success "Created .env.local from .env.example"
        else
            # Create basic .env.local template
            cat > .env.local << EOF
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Optional: Email Configuration (if using custom SMTP)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password
EOF
            print_success "Created .env.local template"
        fi
        
        print_warning "Please update .env.local with your actual Supabase credentials"
        print_info "You can find these in your Supabase project dashboard under Settings > API"
    else
        print_success ".env.local already exists"
    fi
}

# Validate environment variables
validate_environment() {
    print_header "Validating Environment Variables"
    
    if [ -f ".env.local" ]; then
        # Source the environment file
        set -a
        source .env.local
        set +a
        
        # Check required variables
        if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ "$NEXT_PUBLIC_SUPABASE_URL" = "https://your-project-ref.supabase.co" ]; then
            print_error "NEXT_PUBLIC_SUPABASE_URL is not set or still has placeholder value"
            return 1
        else
            print_success "NEXT_PUBLIC_SUPABASE_URL is set"
        fi
        
        if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ] || [ "$NEXT_PUBLIC_SUPABASE_ANON_KEY" = "your-anon-key-here" ]; then
            print_error "NEXT_PUBLIC_SUPABASE_ANON_KEY is not set or still has placeholder value"
            return 1
        else
            print_success "NEXT_PUBLIC_SUPABASE_ANON_KEY is set"
        fi
        
        if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ] || [ "$SUPABASE_SERVICE_ROLE_KEY" = "your-service-role-key-here" ]; then
            print_error "SUPABASE_SERVICE_ROLE_KEY is not set or still has placeholder value"
            return 1
        else
            print_success "SUPABASE_SERVICE_ROLE_KEY is set"
        fi
        
        print_success "All required environment variables are set"
        return 0
    else
        print_error ".env.local file not found"
        return 1
    fi
}

# Run tests
run_tests() {
    print_header "Running Tests"
    
    print_info "Running TypeScript type check..."
    if npm run type-check; then
        print_success "TypeScript type check passed"
    else
        print_error "TypeScript type check failed"
        return 1
    fi
    
    print_info "Running linting..."
    if npm run lint; then
        print_success "Linting passed"
    else
        print_warning "Linting issues found (not blocking deployment)"
    fi
    
    print_info "Running unit tests..."
    if npm test -- --passWithNoTests; then
        print_success "Unit tests passed"
    else
        print_warning "Some unit tests failed (check output above)"
    fi
}

# Build the application
build_application() {
    print_header "Building Application"
    
    print_info "Building Next.js application..."
    if npm run build; then
        print_success "Build completed successfully"
        
        # Check if build output exists
        if [ -d ".next" ]; then
            print_success "Build output directory exists"
        else
            print_error "Build output directory not found"
            return 1
        fi
    else
        print_error "Build failed"
        return 1
    fi
}

# Deploy to Vercel (if Vercel CLI is available)
deploy_to_vercel() {
    print_header "Deploying to Vercel"
    
    if command -v vercel &> /dev/null; then
        print_info "Vercel CLI found. Deploying..."
        
        # Check if already linked to a project
        if [ -f ".vercel/project.json" ]; then
            print_info "Project already linked to Vercel"
        else
            print_info "Linking to Vercel project..."
            vercel link
        fi
        
        # Deploy
        print_info "Deploying to production..."
        vercel --prod
        
        print_success "Deployment completed!"
    else
        print_warning "Vercel CLI not found. Please deploy manually:"
        print_info "1. Go to https://vercel.com"
        print_info "2. Import your GitHub repository"
        print_info "3. Set environment variables in Vercel dashboard"
        print_info "4. Deploy"
    fi
}

# Generate deployment checklist
generate_checklist() {
    print_header "Deployment Checklist"
    
    cat << EOF

📋 Pre-Deployment Checklist:
□ Supabase project created and configured
□ Database schema and RLS policies applied
□ Storage bucket created with proper policies
□ Environment variables set in Vercel
□ Custom domain configured (if applicable)
□ Email notifications tested
□ All tests passing

🚀 Post-Deployment Tasks:
□ Test user registration and login
□ Create test job postings
□ Test application submission
□ Verify email notifications
□ Check mobile responsiveness
□ Set up monitoring and alerts
□ Create user documentation

📞 Support Information:
- Deployment Guide: ./DEPLOYMENT_GUIDE.md
- Supabase Dashboard: https://app.supabase.com
- Vercel Dashboard: https://vercel.com/dashboard

EOF
}

# Main execution
main() {
    echo "Starting production setup process..."
    
    # Run all setup steps
    check_requirements
    install_dependencies
    setup_environment
    
    # Validate environment (allow to continue even if validation fails)
    if ! validate_environment; then
        print_warning "Environment validation failed. Please update .env.local with your Supabase credentials."
        print_info "You can continue with the setup and update the credentials later."
        
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Setup cancelled. Please update your environment variables and run again."
            exit 1
        fi
    fi
    
    # Run tests and build
    if run_tests && build_application; then
        print_success "Application is ready for deployment!"
        
        # Ask if user wants to deploy to Vercel
        read -p "Deploy to Vercel now? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            deploy_to_vercel
        else
            print_info "Skipping Vercel deployment. You can deploy manually later."
        fi
    else
        print_error "Setup completed with issues. Please check the output above."
    fi
    
    # Always show the checklist
    generate_checklist
    
    print_success "Setup script completed!"
    print_info "Next steps: Review the deployment checklist above and follow the DEPLOYMENT_GUIDE.md"
}

# Run main function
main "$@"