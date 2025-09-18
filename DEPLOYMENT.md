# 🚀 Deployment Guide

## Environment Variables Required

### Required Variables
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Application Configuration
NEXT_PUBLIC_BASE_URL=https://your-domain.com

# Optional: Cloudflare Turnstile (for bot protection)
TURNSTILE_SECRET_KEY=your_turnstile_secret_key
```

### Vercel Environment Variables (Auto-set)
- `VERCEL_URL`
- `VERCEL_ENV`
- `VERCEL_PROJECT_PRODUCTION_URL`

## Pre-Deployment Checklist

### 1. Fix TypeScript Build Errors
- [ ] Fix the route parameter type error in `/api/issues/[id]/route.ts`
- [ ] Ensure all API routes have proper error handling
- [ ] Test build locally: `npm run build`

### 2. Database Setup
- [ ] Run database schema in Supabase
- [ ] Set up RLS (Row Level Security) policies
- [ ] Create necessary indexes
- [ ] Set up database functions (route_issue_by_point, issues_nearby)

### 3. Supabase Configuration
- [ ] Configure authentication providers
- [ ] Set up redirect URLs
- [ ] Configure CORS settings
- [ ] Set up storage buckets for images

### 4. Image Optimization
- [ ] Configure image domains in next.config.ts
- [ ] Set up CDN for image delivery
- [ ] Optimize image upload process

### 5. Security
- [ ] Enable RLS on all tables
- [ ] Set up proper CORS policies
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging

## Deployment Platforms

### Vercel (Recommended)
1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically on push

### Other Platforms
- Railway
- Netlify
- AWS Amplify
- DigitalOcean App Platform

## Post-Deployment
1. Test all authentication flows
2. Verify API endpoints work
3. Test image uploads
4. Check mobile responsiveness
5. Set up monitoring
