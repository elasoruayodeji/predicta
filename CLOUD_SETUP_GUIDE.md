# PREDICTA Cloud Setup Guide

## Overview

PREDICTA has been transformed into a cloud-powered fintech platform with:
- ✅ Supabase backend for authentication and database
- ✅ Real-time data synchronization across devices
- ✅ Secure user accounts and data isolation
- ✅ Working light/dark theme system
- ✅ Cloud persistence for all user data

---

## Prerequisites

1. **Supabase Account**: Sign up at https://supabase.com
2. **Node.js 18+**: For running the backend server
3. **Investo API Key**: Get from https://investo.ng/developers/keys

---

## Step 1: Set Up Supabase Project

### 1.1 Create Supabase Project

1. Go to https://supabase.com/dashboard/
2. Click "New Project"
3. Fill in:
   - **Name**: `predicta` (or your preferred name)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to your users
4. Click "Create new project"
5. Wait for project to initialize (2-3 minutes)

### 1.2 Get Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...` (long string)

### 1.3 Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Supabase credentials:
   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   INVESTO_API_KEY=your-investo-key-here
   ```

**⚠️ IMPORTANT**: 
- Never commit `.env` to git
- The `anon` key is safe to expose in frontend code
- Never use the `service_role` key in frontend

---

## Step 2: Set Up Database Schema

### 2.1 Run Database Migration

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Paste into the SQL editor
5. Click "Run" (or press Ctrl+Enter)

This will create:
- ✅ User profiles table
- ✅ User settings table
- ✅ Watchlists and watchlist items
- ✅ Portfolio accounts and transactions
- ✅ Alerts and alert history
- ✅ Calendar events
- ✅ Journal entries
- ✅ Saved research
- ✅ Screener presets
- ✅ Row Level Security (RLS) policies
- ✅ Auto-created profile/settings on signup

### 2.2 Verify Tables Created

1. Go to **Table Editor** in Supabase dashboard
2. You should see these tables:
   - `profiles`
   - `user_settings`
   - `watchlists`
   - `watchlist_items`
   - `portfolio_accounts`
   - `portfolio_transactions`
   - `alerts`
   - `alert_history`
   - `calendar_events`
   - `journal_entries`
   - `saved_research`
   - `screener_presets`

---

## Step 3: Configure Authentication

### 3.1 Enable Email Authentication

1. Go to **Authentication** → **Providers**
2. Make sure **Email** is enabled
3. Optional: Configure email templates in **Authentication** → **Email Templates**

### 3.2 Configure Auth Settings

1. Go to **Authentication** → **Providers** → **Email**
2. Enable "Confirm email" (recommended for security)
3. Optional: Disable if you want instant access (not recommended for production)

### 3.3 Test Authentication

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:5173
3. You should see the app without authentication errors
4. If Supabase is not configured, the app will work in "offline mode" with localStorage

---

## Step 4: Run the Application

### 4.1 Development Mode

```bash
# Install dependencies (if not done)
npm install

# Start both frontend and backend
npm run dev
```

This starts:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

### 4.2 Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

---

## Step 5: Test Cloud Features

### 5.1 Create Account

1. Navigate to the app (http://localhost:5173)
2. You'll need to create an auth UI (see Step 6)
3. For now, test via Supabase dashboard:
   - Go to **Authentication** → **Users**
   - Click "Add user" → "Create new user"
   - Enter email and password
   - User is created automatically with profile and settings

### 5.2 Test Data Sync

1. Sign in with your test user
2. Add a stock to watchlist
3. Refresh the page
4. Watchlist should persist
5. Sign in on another device/browser
6. Watchlist should appear (cross-device sync)

---

## Step 6: Create Authentication UI (Optional)

The current implementation doesn't include a login/signup UI. You have two options:

### Option A: Use Supabase's Built-in UI (Quick)

1. Go to **Authentication** → **URL Configuration**
2. Copy the "Site URL" (e.g., `http://localhost:5173`)
3. Add redirect URLs:
   - `http://localhost:5173/**`
   - Your production URL

### Option B: Build Custom Auth UI (Recommended)

Create authentication pages:
- `/login` - Sign in form
- `/signup` - Sign up form
- `/reset-password` - Password reset
- `/profile` - User profile management

See the implementation guide in the next section.

---

## Step 7: Deploy to Production

### 7.1 Deploy Frontend to Vercel

1. Push your code to GitHub
2. Go to https://vercel.com
3. Import your GitHub repository
4. Configure environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `INVESTO_API_KEY`
5. Deploy

### 7.2 Deploy Backend (Optional)

If you need the Investo API proxy:

**Option A: Vercel Serverless Functions**
- Already configured in `api/` directory
- Will deploy automatically with frontend

**Option B: Separate Backend**
- Deploy `server/index.cjs` to Railway, Render, or similar
- Update frontend API URL to point to your backend

---

## Step 8: Configure Alert Evaluation (Advanced)

Alerts need a backend worker to evaluate conditions. Options:

### Option A: Supabase Edge Functions (Recommended)

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Create edge function:
   ```bash
   supabase functions new evaluate-alerts
   ```

3. Implement alert evaluation logic in `supabase/functions/evaluate-alerts/index.ts`

4. Set up cron job to run every 5 minutes:
   ```bash
   supabase functions deploy evaluate-alerts
   ```

### Option B: External Worker

Use a service like:
- **Railway** (easy deployment)
- **Render** (free tier available)
- **AWS Lambda** (with CloudWatch Events)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│  React + TypeScript + Vite                                   │
│  - AuthContext (authentication state)                        │
│  - ThemeContext (theme management)                           │
│  - DataService (cloud database operations)                   │
│  - localStorage (offline fallback)                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                      SUPABASE                                │
│  - Authentication (email/password)                           │
│  - PostgreSQL Database (user data)                           │
│  - Row Level Security (data isolation)                       │
│  - Real-time subscriptions (optional)                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND PROXY                              │
│  Express Server (server/index.cjs)                           │
│  - Investo API proxy                                         │
│  - API key protection                                        │
│  - Request caching                                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    INVESTO API                               │
│  - NGX market data                                           │
│  - Stock prices                                              │
│  - Market signals                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### User Authentication
```
User signs up → Supabase Auth → Profile created → Settings created → Ready to use
```

### Data Persistence
```
User action → DataService → Supabase → Database → Real-time sync → All devices updated
```

### Offline Fallback
```
No internet → localStorage → Data saved locally → Sync when online
```

---

## Security Features

✅ **Row Level Security (RLS)**: Each user can only access their own data  
✅ **API Key Protection**: Investo key only on server, never in frontend  
✅ **Secure Authentication**: Supabase Auth with email confirmation  
✅ **Data Validation**: All inputs validated before database operations  
✅ **HTTPS Only**: All communication encrypted in transit  

---

## Troubleshooting

### "Supabase not configured" warning
- Check `.env` file exists and has correct values
- Restart development server after changing `.env`
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set

### Database tables not created
- Run the migration SQL in Supabase SQL Editor
- Check for errors in the SQL output
- Verify you're connected to the correct project

### Authentication not working
- Check Supabase dashboard → Authentication → Users
- Verify email provider is enabled
- Check browser console for errors

### Theme not switching
- Clear browser cache
- Check browser console for errors
- Verify CSS variables are loading

### Data not syncing across devices
- Verify you're signed in with the same account
- Check browser console for database errors
- Verify RLS policies are applied

---

## Next Steps

1. ✅ Set up Supabase project
2. ✅ Run database migration
3. ✅ Configure environment variables
4. ✅ Test authentication
5. ✅ Test data sync
6. ⏳ Build authentication UI (optional)
7. ⏳ Deploy to production
8. ⏳ Set up alert evaluation worker (optional)

---

## Support

- **Supabase Docs**: https://supabase.com/docs
- **Investo API**: https://investo.ng/developers
- **PREDICTA Issues**: Check browser console and Supabase logs

---

**Last Updated**: 2026  
**Status**: Ready for cloud deployment
