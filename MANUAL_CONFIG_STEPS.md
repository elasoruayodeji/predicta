# Manual Configuration Steps

This guide lists all the manual steps you must complete in Supabase to enable the new authentication features.

---

## Step 1: Enable Email Confirmation

**Location:** Supabase Dashboard → Authentication → Providers → Email

**Actions:**
1. Toggle "Confirm email" to **ON**
2. Click "Save"

**What this does:**
- New users must verify their email before accessing the dashboard
- Supabase will send verification emails automatically
- Users who don't verify cannot access protected features

**Verification:**
- Sign up with a new account
- Try to access dashboard → Should redirect to verification page
- Check Supabase Dashboard → Authentication → Users
- New user should have `email_confirmed_at` as NULL until verified

---

## Step 2: Configure Site URL

**Location:** Supabase Dashboard → Authentication → URL Configuration

**Actions:**
1. Set **Site URL**:
   - Development: `http://localhost:5173`
   - Production: `https://your-domain.com`

2. Add **Redirect URLs** (click "+ Add URL" for each):
   ```
   http://localhost:5173/auth/callback
   http://localhost:5173/auth/verify-email
   http://localhost:5173/auth/reset-password
   ```
   
   For production, also add:
   ```
   https://your-domain.com/auth/callback
   https://your-domain.com/auth/verify-email
   https://your-domain.com/auth/reset-password
   ```

3. Click "Save"

**What this does:**
- Tells Supabase where to redirect after authentication
- Allows email verification links to work
- Allows password reset links to work

**Verification:**
- Sign up → Check verification email link
- Click link → Should redirect to your app
- Request password reset → Check reset email link
- Click link → Should redirect to reset password page

---

## Step 3: Configure Email Templates (Optional)

**Location:** Supabase Dashboard → Authentication → Email Templates

**Actions:**
1. Select template: "Confirm signup"
2. Customize with PREDICTA branding:
   ```html
   <h1>Welcome to PREDICTA!</h1>
   <p>Click the link below to verify your email address:</p>
   <a href="{{ .ConfirmationURL }}">Verify Email</a>
   ```
3. Repeat for "Reset password" template
4. Click "Save"

**What this does:**
- Makes emails look professional with your branding
- Improves user trust and recognition

**Note:** This is optional. Supabase provides default templates that work fine.

---

## Step 4: Test Email Delivery (Development)

**Location:** Supabase Dashboard → Authentication → Users

**Actions:**
1. Sign up with a new account
2. Go to Authentication → Users
3. Find your user
4. Check "Email confirmed" column → Should be "No"
5. Go to Authentication → Emails (or check logs)
6. Verify email was "sent" (logged in development)

**What this does:**
- Confirms email system is working
- In development, emails are logged but not actually sent
- For production, you need custom SMTP (see Step 5)

**Verification:**
- User appears in Supabase Users list
- Email confirmation is pending
- Verification link is generated

---

## Step 5: Configure Custom SMTP (Production Only)

**Location:** Supabase Dashboard → Project Settings → SMTP

**Actions:**
1. Toggle "Use custom SMTP" to **ON**
2. Enter SMTP credentials:
   - **Host:** `smtp.your-provider.com`
   - **Port:** `587` (TLS) or `465` (SSL)
   - **Username:** `support@predicta.ng`
   - **Password:** Your SMTP password
   - **Sender email:** `support@predicta.ng`
   - **Sender name:** `PREDICTA`
3. Click "Test connection"
4. If successful, click "Save"

**What this does:**
- Sends real emails from your domain
- Professional sender address (support@predicta.ng)
- Required for production use

**Recommended SMTP Providers:**

| Provider | Free Tier | Cost | Notes |
|----------|-----------|------|-------|
| SendGrid | 100 emails/day | $0.01/email after | Reliable, good docs |
| Mailgun | 5,000 emails/month (3 months) | $0.80/1000 emails | Good for startups |
| Amazon SES | 62,000 emails/month (free if sent from EC2) | $0.10/1000 emails | Cheapest at scale |
| Postmark | 100 emails/month | $1.25/1000 emails | Best deliverability |

**Setup Example (SendGrid):**
1. Sign up at https://sendgrid.com
2. Verify your domain (predicta.ng)
3. Create API key
4. Get SMTP credentials:
   - Host: `smtp.sendgrid.net`
   - Port: `587`
   - Username: `apikey`
   - Password: Your API key
5. Enter in Supabase SMTP settings
6. Test connection

**Verification:**
- Sign up with new account
- Check your email inbox
- Should receive verification email from support@predicta.ng
- Click link → Should verify email

---

## Step 6: Verify Row Level Security (RLS)

**Location:** Supabase Dashboard → Authentication → Policies

**Actions:**
1. Check each table has RLS enabled:
   - `profiles` ✅
   - `user_settings` ✅
   - `watchlists` ✅
   - `watchlist_items` ✅
   - `portfolio_accounts` ✅
   - `portfolio_transactions` ✅
   - `alerts` ✅
   - `alert_history` ✅
   - `calendar_events` ✅
   - `journal_entries` ✅
   - `saved_research` ✅
   - `screener_presets` ✅

2. Verify policies exist for each table:
   - SELECT: Users can only view their own data
   - INSERT: Users can only insert their own data
   - UPDATE: Users can only update their own data
   - DELETE: Users can only delete their own data

**What this does:**
- Ensures users can only access their own data
- Prevents data leaks between users
- Enforced at database level

**Verification:**
- Sign in as User A
- Create some data (watchlist, portfolio, etc.)
- Sign out
- Sign in as User B
- Try to access User A's data → Should fail
- User B should only see their own data

---

## Step 7: Test Complete Auth Flow

**Actions:**
1. **Sign Up:**
   - Go to landing page
   - Click "Get Started"
   - Fill in form (name, email, password)
   - Submit
   - Should see "Verify Your Email" screen

2. **Verify Email:**
   - Check email (or Supabase logs in dev)
   - Click verification link
   - Should redirect to success screen
   - Then redirect to dashboard

3. **Sign Out:**
   - Click sign out button
   - Should redirect to landing page

4. **Sign In:**
   - Click "Sign In"
   - Enter email and password
   - Should redirect to dashboard

5. **Forgot Password:**
   - Sign out
   - Click "Forgot password?"
   - Enter email
   - Check email for reset link
   - Click link
   - Set new password
   - Sign in with new password

6. **Google OAuth:**
   - Sign out
   - Click "Sign in with Google"
   - Complete OAuth flow
   - Should be automatically verified
   - Should redirect to dashboard

**Verification:**
- ✅ All flows work correctly
- ✅ Emails are sent (or logged in dev)
- ✅ Redirects work properly
- ✅ Data persists correctly
- ✅ Security is enforced

---

## Step 8: Production Deployment Checklist

**Before deploying to production:**

- [ ] Enable email confirmation in Supabase
- [ ] Configure site URL for production domain
- [ ] Add production redirect URLs
- [ ] Configure custom SMTP (see Step 5)
- [ ] Test email delivery with real emails
- [ ] Verify all RLS policies
- [ ] Test complete auth flow in production
- [ ] Update environment variables in hosting platform
- [ ] Test Google OAuth in production
- [ ] Verify HTTPS is enabled
- [ ] Test on multiple devices/browsers
- [ ] Check mobile responsiveness

---

## Troubleshooting

### Issue: Verification email not received

**Solutions:**
1. Check spam/junk folder
2. Verify SMTP is configured (production)
3. Check Supabase logs for email delivery errors
4. Verify email address is correct
5. Try resending verification email

### Issue: Verification link doesn't work

**Solutions:**
1. Check redirect URLs in Supabase include your domain
2. Verify link hasn't expired (default: 24 hours)
3. Check browser console for errors
4. Try requesting new verification email

### Issue: Password reset link doesn't work

**Solutions:**
1. Check redirect URLs in Supabase
2. Verify link hasn't expired (default: 1 hour)
3. Check browser console for errors
4. Try requesting new reset link

### Issue: Google OAuth fails

**Solutions:**
1. Verify Google Cloud Console configuration
2. Check redirect URIs match exactly
3. Verify Client ID and Secret in Supabase
4. Check browser console for errors
5. Try in incognito mode (clears cache)

### Issue: User can access dashboard without verification

**Solutions:**
1. Verify "Confirm email" is enabled in Supabase
2. Check App.tsx has verification check
3. Clear browser cache and localStorage
4. Sign out and sign in again
5. Check user's `email_confirmed_at` in Supabase

---

## Support Resources

- **Supabase Auth Docs:** https://supabase.com/docs/guides/auth
- **Email Configuration:** https://supabase.com/docs/guides/auth/auth-email
- **Custom SMTP:** https://supabase.com/docs/guides/auth/auth-smtp
- **RLS Policies:** https://supabase.com/docs/guides/auth/row-level-security

---

## Summary

**Required Steps:**
1. ✅ Enable email confirmation
2. ✅ Configure site URL and redirects
3. ⏳ Configure custom SMTP (production only)
4. ✅ Test complete auth flow

**Time Required:** 15-30 minutes

**Difficulty:** Easy (follow steps above)

**Status:** Ready for configuration
