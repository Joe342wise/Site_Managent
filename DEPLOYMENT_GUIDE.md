# Deployment Guide for Construction Site Management System

This guide will walk you through deploying your application to:
- **Supabase** (Database)
- **Render** (Backend API)
- **Vercel** (Frontend)

## 🗄️ Step 1: Set up Supabase Database

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Set project name: `construction-site-manager`
5. Set database password (save this!)
6. Select region closest to your users
7. Click "Create new project"

### 1.2 Import Database Schema
1. Wait for project to be ready (~2-3 minutes)
2. Go to SQL Editor in your Supabase dashboard
3. Copy and paste the contents of `src/config/postgresql_schema.sql`
4. Click "Run" to create all tables and data

### 1.3 Get Database Credentials
1. Go to **Settings** → **Database**
2. Copy the connection string under **Connection string** → **URI**
3. It looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
4. Save this for later

## 🚀 Step 2: Deploy Backend to Render

### 2.1 Create Render Account
1. Go to [render.com](https://render.com) and sign up
2. Connect your GitHub account
3. Import your repository

### 2.2 Create Web Service
1. Click "New Web Service"
2. Connect your GitHub repository: `Site_Managent`
3. Configure build settings:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free` (for now)

### 2.3 Environment Variables
Add these environment variables in Render:
```bash
# From your Supabase connection string
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Generate a strong JWT secret
JWT_SECRET=your-super-secure-jwt-secret-key-production-2024
JWT_EXPIRES_IN=24h

# Server config
PORT=10000
NODE_ENV=production

# Company info
COMPANY_NAME=De'Aion Contractors
COMPANY_PHONE1=0242838007
COMPANY_PHONE2=0208936345
COMPANY_CURRENCY=GHS

# Optional: Email settings (if you want forgot password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
SMTP_FROM=your_email@gmail.com
```

### 2.4 Deploy
1. Click "Create Web Service"
2. Wait for deployment (~5-10 minutes)
3. Your API will be available at: `https://your-service-name.onrender.com`
4. Test health check: `https://your-service-name.onrender.com/api/health`

## 🌐 Step 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Account
1. Go to [vercel.com](https://vercel.com) and sign up
2. Connect your GitHub account

### 3.2 Import Project
1. Click "New Project"
2. Import your GitHub repository
3. **Important**: Set root directory to `frontend`
4. Framework preset should auto-detect as "Vite"

### 3.3 Environment Variables
Add in Vercel environment variables:
```bash
VITE_API_URL=https://your-render-service-name.onrender.com
```

### 3.4 Build Settings (Auto-detected)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3.5 Deploy
1. Click "Deploy"
2. Wait for build (~2-3 minutes)
3. Your app will be live at: `https://your-app-name.vercel.app`

## ✅ Step 4: Verify Deployment

### 4.1 Test Backend
```bash
# Health check
curl https://your-service-name.onrender.com/api/health

# Should return: {"status":"ok","timestamp":"..."}
```

### 4.2 Test Frontend
1. Visit your Vercel URL
2. Try to login with: `admin / admin123`
3. Check that data loads properly

### 4.3 Test Full Integration
1. Create a new site
2. Add an estimate
3. Record actual costs
4. Generate a PDF report

## 🔧 Configuration Files Created

The deployment process created these files:

- `render.yaml` - Render deployment configuration
- `Dockerfile` - Container configuration (optional)
- `frontend/vercel.json` - Vercel deployment settings
- `.env.production` - Production environment template
- `frontend/.env.production` - Frontend environment template

## 🚨 Important Security Notes

1. **Database Password**: Never commit your Supabase password to Git
2. **JWT Secret**: Generate a strong, unique JWT secret for production
3. **Environment Variables**: All sensitive data should be in environment variables
4. **HTTPS**: Both Render and Vercel provide HTTPS by default

## 💡 Cost Considerations

### Free Tier Limits:
- **Supabase**: 2 projects, 500MB database, 50MB file storage
- **Render**: 750 hours/month, sleeps after 15 minutes of inactivity
- **Vercel**: Unlimited static deployments, 100GB bandwidth

### Upgrading:
- Start with free tiers for prototyping
- Upgrade Render to prevent sleeping if needed ($7/month)
- Supabase Pro for larger database ($25/month)

## 🔄 Custom Domain (Optional)

### For Vercel Frontend:
1. Go to your project settings in Vercel
2. Add your custom domain
3. Update DNS records as instructed

### For Render Backend:
1. Upgrade to a paid plan
2. Add custom domain in service settings
3. Update DNS records

## 🐛 Troubleshooting

### Common Issues:

1. **Build Failed**: Check Node.js version compatibility
2. **Database Connection Failed**: Verify Supabase connection string
3. **Frontend Can't Connect**: Check VITE_API_URL environment variable
4. **CORS Errors**: Make sure backend allows your frontend domain

### Logs:
- **Render**: View logs in service dashboard
- **Vercel**: View function logs in project dashboard
- **Supabase**: View database logs in project dashboard

## 🔄 Updates

To update your deployment:

1. **Backend**: Push to GitHub → Render auto-deploys
2. **Frontend**: Push to GitHub → Vercel auto-deploys
3. **Database**: Run new SQL in Supabase SQL Editor

## 📞 Support

- **Render**: [render.com/docs](https://render.com/docs)
- **Vercel**: [vercel.com/docs](https://vercel.com/docs)
- **Supabase**: [supabase.com/docs](https://supabase.com/docs)