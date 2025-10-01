# GitHub Setup Guide

## 🚀 Quick GitHub Setup

You need to push your code to GitHub before deploying to Vercel. Here are two ways to do it:

### Option 1: Automated Script (Recommended)
```bash
./scripts/setup-github.sh
```

### Option 2: Manual Setup

#### Step 1: Create GitHub Repository
1. Go to [github.com/new](https://github.com/new)
2. Repository name: `university-job-bank` (or your preferred name)
3. Description: `Job posting and application platform for Acadia University`
4. Make it **Public** (or Private if you prefer)
5. **Don't** initialize with README, .gitignore, or license (we already have files)
6. Click "Create repository"

#### Step 2: Push Your Code
```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit your code
git commit -m "Initial commit: University Job Bank application"

# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/university-job-bank.git

# Push to GitHub
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

## ✅ Verify Upload

After pushing, check your GitHub repository. You should see all these files:

```
university-job-bank/
├── src/                    # All your React components
├── supabase/              # Database migrations and functions
├── e2e/                   # End-to-end tests
├── scripts/               # Deployment scripts
├── package.json           # Dependencies
├── next.config.js         # Next.js configuration
├── tailwind.config.ts     # Tailwind CSS config
├── tsconfig.json          # TypeScript config
├── .env.example           # Environment variables template
├── DEPLOYMENT_GUIDE.md    # Full deployment guide
└── README.md              # Project documentation
```

## 🚨 Important Notes

1. **Don't commit `.env.local`** - It's in `.gitignore` for security
2. **Keep your Supabase keys secret** - Never commit them to public repos
3. **Use `.env.example`** as a template for others

## Next Steps

Once your code is on GitHub:

1. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Add environment variables
   - Deploy!

2. **Set up Supabase**:
   - Follow the database setup in `DEPLOYMENT_GUIDE.md`

## Troubleshooting

### "Repository not found" error
- Make sure the repository exists on GitHub
- Check that you have the correct repository URL
- Verify you have push permissions

### Authentication failed
- For HTTPS: Use your GitHub username and personal access token
- For SSH: Make sure your SSH key is added to GitHub

### Large files warning
- The repository should be under 100MB
- If you have large files, add them to `.gitignore`

## Need Help?

- **GitHub Docs**: https://docs.github.com/en/get-started
- **Git Tutorial**: https://git-scm.com/docs/gittutorial
- **SSH Setup**: https://docs.github.com/en/authentication/connecting-to-github-with-ssh