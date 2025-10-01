#!/bin/bash

# University Job Bank - GitHub Setup Script
# This script helps you push your code to GitHub

set -e

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

echo "🚀 University Job Bank - GitHub Setup"
echo "======================================"

# Check if git is initialized
check_git_init() {
    print_header "Checking Git Repository"
    
    if [ -d ".git" ]; then
        print_success "Git repository already initialized"
        return 0
    else
        print_info "Initializing Git repository..."
        git init
        print_success "Git repository initialized"
        return 0
    fi
}

# Check if remote origin exists
check_remote() {
    print_header "Checking Git Remote"
    
    if git remote get-url origin &> /dev/null; then
        REMOTE_URL=$(git remote get-url origin)
        print_success "Remote origin already set: $REMOTE_URL"
        return 0
    else
        print_warning "No remote origin set"
        return 1
    fi
}

# Add remote origin
add_remote() {
    print_header "Setting Up GitHub Remote"
    
    echo "Please provide your GitHub repository URL:"
    echo "Examples:"
    echo "  HTTPS: https://github.com/username/university-job-bank.git"
    echo "  SSH:   git@github.com:username/university-job-bank.git"
    echo ""
    
    read -p "GitHub repository URL: " REPO_URL
    
    if [ -z "$REPO_URL" ]; then
        print_error "Repository URL cannot be empty"
        return 1
    fi
    
    # Validate URL format
    if [[ $REPO_URL == *"github.com"* ]]; then
        git remote add origin "$REPO_URL"
        print_success "Remote origin added: $REPO_URL"
        return 0
    else
        print_error "Invalid GitHub URL format"
        return 1
    fi
}

# Stage all files
stage_files() {
    print_header "Staging Files"
    
    # Check if .gitignore exists
    if [ ! -f ".gitignore" ]; then
        print_warning ".gitignore not found, creating one..."
        # Create basic .gitignore if it doesn't exist
        cat > .gitignore << 'EOF'
node_modules/
.next/
.env*.local
.vercel
*.log
.DS_Store
EOF
        print_success "Created .gitignore"
    fi
    
    # Add all files
    git add .
    
    # Show status
    print_info "Files to be committed:"
    git status --short
    
    print_success "All files staged"
}

# Commit changes
commit_changes() {
    print_header "Committing Changes"
    
    # Check if there are any changes to commit
    if git diff --cached --quiet; then
        print_warning "No changes to commit"
        return 0
    fi
    
    # Get commit message
    echo "Enter a commit message (or press Enter for default):"
    read -p "Commit message: " COMMIT_MSG
    
    if [ -z "$COMMIT_MSG" ]; then
        COMMIT_MSG="Initial commit: University Job Bank application"
    fi
    
    git commit -m "$COMMIT_MSG"
    print_success "Changes committed: $COMMIT_MSG"
}

# Push to GitHub
push_to_github() {
    print_header "Pushing to GitHub"
    
    # Check if we're on main or master branch
    CURRENT_BRANCH=$(git branch --show-current)
    print_info "Current branch: $CURRENT_BRANCH"
    
    # If we're on master, rename to main (modern convention)
    if [ "$CURRENT_BRANCH" = "master" ]; then
        print_info "Renaming master branch to main..."
        git branch -M main
        CURRENT_BRANCH="main"
    fi
    
    # Push to GitHub
    print_info "Pushing to GitHub..."
    if git push -u origin "$CURRENT_BRANCH"; then
        print_success "Successfully pushed to GitHub!"
        
        # Get the repository URL for display
        REPO_URL=$(git remote get-url origin)
        # Convert SSH to HTTPS for display
        if [[ $REPO_URL == git@github.com:* ]]; then
            DISPLAY_URL="https://github.com/${REPO_URL#git@github.com:}"
            DISPLAY_URL="${DISPLAY_URL%.git}"
        else
            DISPLAY_URL="${REPO_URL%.git}"
        fi
        
        print_success "Your repository is now available at: $DISPLAY_URL"
        return 0
    else
        print_error "Failed to push to GitHub"
        print_info "This might be because:"
        print_info "1. The repository doesn't exist on GitHub"
        print_info "2. You don't have permission to push"
        print_info "3. Authentication failed"
        return 1
    fi
}

# Create GitHub repository (if GitHub CLI is available)
create_github_repo() {
    print_header "Creating GitHub Repository"
    
    if command -v gh &> /dev/null; then
        print_info "GitHub CLI found. Would you like to create a new repository?"
        read -p "Create new GitHub repository? (y/N): " -n 1 -r
        echo
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "Enter repository name (or press Enter for 'university-job-bank'):"
            read -p "Repository name: " REPO_NAME
            
            if [ -z "$REPO_NAME" ]; then
                REPO_NAME="university-job-bank"
            fi
            
            echo "Repository description:"
            read -p "Description: " REPO_DESC
            
            if [ -z "$REPO_DESC" ]; then
                REPO_DESC="Job posting and application platform for Acadia University"
            fi
            
            # Create repository
            if gh repo create "$REPO_NAME" --description "$REPO_DESC" --public; then
                print_success "GitHub repository created: $REPO_NAME"
                
                # Add remote
                GITHUB_USER=$(gh api user --jq .login)
                git remote add origin "https://github.com/$GITHUB_USER/$REPO_NAME.git"
                print_success "Remote origin added"
                return 0
            else
                print_error "Failed to create GitHub repository"
                return 1
            fi
        fi
    else
        print_info "GitHub CLI not found. Please create repository manually:"
        print_info "1. Go to https://github.com/new"
        print_info "2. Create a new repository named 'university-job-bank'"
        print_info "3. Don't initialize with README (we already have files)"
        print_info "4. Copy the repository URL and run this script again"
    fi
}

# Main execution
main() {
    print_info "This script will help you push your University Job Bank code to GitHub"
    echo ""
    
    # Check if git is installed
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed. Please install Git first."
        exit 1
    fi
    
    # Initialize git if needed
    check_git_init
    
    # Check if remote exists, if not try to add one
    if ! check_remote; then
        # Try to create repo with GitHub CLI first
        if ! create_github_repo; then
            # If that fails, ask for manual remote
            if ! add_remote; then
                print_error "Failed to set up remote repository"
                exit 1
            fi
        fi
    fi
    
    # Stage files
    stage_files
    
    # Commit changes
    commit_changes
    
    # Push to GitHub
    if push_to_github; then
        print_success "🎉 Your code is now on GitHub!"
        print_info ""
        print_info "Next steps:"
        print_info "1. Go to https://vercel.com"
        print_info "2. Click 'New Project'"
        print_info "3. Import your GitHub repository"
        print_info "4. Add environment variables"
        print_info "5. Deploy!"
        print_info ""
        print_info "See DEPLOYMENT_GUIDE.md for detailed instructions."
    else
        print_error "Failed to push to GitHub. Please check the errors above."
        exit 1
    fi
}

# Run main function
main "$@"