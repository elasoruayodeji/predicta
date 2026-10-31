# Google OAuth Setup Guide

## Overview

This guide walks you through setting up Google OAuth authentication for PREDICTA using Supabase.

## Prerequisites

- PREDICTA application running
- Supabase project configured
- Google Cloud Console account

---

## Step 1: Configure Google Cloud Console

### 1.1 Create a Google Cloud Project

1. Go to https://console.cloud.google.com/
2. Click **Select a project** → **New Project**
3. Enter project name: `PREDICTA Auth` (or your preferred name)
4. Click **Create**
5. Wait for project to be created (about 30 seconds)

### 1.2 Configure OAuth Consent Screen

1. In Google Cloud Console, go to **APIs & Services** → **OAuth consent screen**
2. Select **External** user type
3. Click **Create**
4. Fill in the form:
   - **App name**: `PREDICTA`
   - **User support email**: Your email address
   - **App logo**: Upload PREDICTA logo (optional)
   - **Developer contact information**: Your email address
5. Click **Save and Continue**
6. On **Scopes** page, click **Add or Remove Scopes**
7. Search for and select:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`
8. Click **Update**
9. Click **Save and Continue**
10. On **Test users** page, click **Add Users**
11. Add your email address (for testing)
12. Click **Add**
13. Click **Save and Continue**
14. Review and click **Back to Dashboard**

### 1.3 Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Select **Application type**: `Web application`
4. Enter **Name**: `PREDICTA Web Client`
5. Under **Authorized redirect URIs**, add:
   ```
   https://YOUR-PROJECT-ID.supabase.co/auth/v1/callback
   http://localhost:5173/auth/callback
   ```
   Replace `YOUR-PROJECT-ID` with your actual Supabase project ID
6. Click **Create**
7. **Copy the Client ID and Client Secret** (you'll need these for Supabase)
8. Click **OK**

---

## Step 2: Configure Supabase

### 2.1 Enable Google Provider

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers**
3. Find **Google** in the list
4. Toggle it **ON**
5. Fill in the configuration:
   - **Client ID**: Paste the Client ID from Google Cloud Console
   - **Client Secret**: Paste the Client Secret from Google Cloud Console
6. Click **Save**

### 2.2 Verify Redirect URL

1. In Supabase dashboard, go to **Authentication** → **URL Configuration**
2. Verify the **Site URL** is set correctly:
   - Development: `http://localhost:5173`
   - Production: `https://your-domain.com`
3. Verify **Redirect URLs** includes:
   - `http://localhost:5173/auth/callback`
   - `https://your-domain.com/auth/callback` (for production)

---

## Step 3: Test Google OAuth

### 3.1 Start Development Server

```bash
npm run dev
```

### 3.2 Test Sign In with Google

1. Open http://localhost:5173
2. You should see the landing page
3. Click **Sign In**
4. Click **Sign in with Google** button
5. You should be redirected to Google's OAuth consent screen
6. Select your Google account
7. Grant permissions
8. You should be redirected back to PREDICTA
9. You should be logged in and see the dashboard

### 3.3 Test Sign Up with Google

1. Sign out from PREDICTA
2. Click **Get Started** on landing page
3. Click **Sign up with Google** button
4. Follow the OAuth flow
5. After authentication, you should be redirected to dashboard
6. Check Supabase Dashboard → Authentication → Users
7. Your Google account should appear in the users list
8. Check Supabase Dashboard → Table Editor → profiles
9. Your profile should be created with your Google name

---

## Step 4: Production Configuration

### 4.1 Update Google Cloud Console

1. Go to Google Cloud Console → Credentials
2. Edit your OAuth 2.0 Client
3. Under **Authorized redirect URIs**, add your production URL:
   ```
   https://your-domain.com/auth/callback
   ```
4. Click **Save**

### 4.2 Update Supabase

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Update **Site URL** to your production domain
3. Update **Redirect URLs** to include production callback URL
4. Click **Save**

### 4.3 Environment Variables

No additional environment variables needed - Supabase handles OAuth configuration.

---

## Troubleshooting

### Issue: "Redirect URI mismatch"
**Solution:**
- Check that the redirect URI in Google Cloud Console exactly matches Supabase's callback URL
- Format: `https://YOUR-PROJECT-ID.supabase.co/auth/v1/callback`
- No trailing slashes
- HTTPS required for production

### Issue: "Access denied" or "Invalid credentials"
**Solution:**
- Verify Client ID and Client Secret are correct in Supabase
- Check that Google provider is enabled in Supabase
- Ensure OAuth consent screen is configured and published

### Issue: User not created in database
**Solution:**
- Check that database trigger `handle_new_user` exists
- Verify RLS policies allow INSERT on profiles and user_settings tables
- Check Supabase logs for errors

### Issue: Redirect loop
**Solution:**
- Check that Site URL in Supabase matches your app's URL
- Verify callback route is properly handled in App.tsx
- Clear browser cache and cookies

### Issue: "Popup blocked by browser"
**Solution:**
- This shouldn't happen with redirect flow (we're using redirect, not popup)
- If it does, check browser settings
- Try a different browser

---

## Security Best Practices

### 1. Restrict OAuth Consent Screen
- Start with **Testing** mode
- Only add trusted test users
- When ready, submit for **Verification** to go public

### 2. Use HTTPS in Production
- Never use HTTP for OAuth callbacks
- Supabase provides HTTPS by default
- Use HTTPS for your custom domain

### 3. Protect Client Secret
- Never commit Client Secret to git
- Only store in Supabase (encrypted)
- Never expose in frontend code

### 4. Validate Redirect URIs
- Only allow your domain's callback URL
- Never use wildcards
- Keep the list minimal

### 5. Monitor Authentication Logs
- Check Supabase Authentication logs regularly
- Monitor for suspicious activity
- Set up alerts for failed login attempts

---

## Advanced Configuration

### Custom Scopes

If you need additional Google scopes (e.g., calendar, drive):

1. Go to Google Cloud Console → OAuth consent screen
2. Click **Add or Remove Scopes**
3. Add required scopes
4. Update Supabase Google provider configuration

### Custom Redirect After Login

To redirect to a specific page after OAuth:

```typescript
// In AuthCallback.tsx
const redirectTo = sessionStorage.getItem('oauth_redirect') || '/dashboard';
setTimeout(() => onNavigate?.(redirectTo), 1500);
```

### Multi-Factor Authentication

To require MFA after Google OAuth:

1. Enable MFA in Supabase Dashboard → Authentication → Settings
2. Configure MFA provider (SMS, TOTP)
3. Update AuthCallback to check for MFA requirement
4. Redirect to MFA setup if needed

---

## Testing Checklist

- [ ] Google Cloud project created
- [ ] OAuth consent screen configured
- [ ] OAuth 2.0 credentials created
- [ ] Redirect URIs added (dev + prod)
- [ ] Client ID and Secret copied
- [ ] Supabase Google provider enabled
- [ ] Client ID and Secret pasted in Supabase
- [ ] Redirect URLs configured in Supabase
- [ ] Test sign in with Google works
- [ ] Test sign up with Google works
- [ ] User created in Supabase Auth
- [ ] Profile created in database
- [ ] Settings created in database
- [ ] Redirect to dashboard works
- [ ] Sign out works
- [ ] Sign in again works
- [ ] Production URLs configured
- [ ] HTTPS enabled in production

---

## Support Resources

- **Supabase Auth Docs**: https://supabase.com/docs/guides/auth
- **Google OAuth Docs**: https://developers.google.com/identity/protocols/oauth2
- **Supabase Google Provider**: https://supabase.com/docs/guides/auth/social-login/auth-google

---

## Summary

Google OAuth is now fully implemented in PREDICTA. After completing the configuration steps above, users will be able to:

✅ Sign in with their Google account  
✅ Sign up with their Google account  
✅ Have their profile automatically created  
✅ Be redirected to the dashboard after authentication  
✅ Sign out and sign in again  

**Status:** ✅ Implementation Complete  
**Next Step:** Configure Google Cloud Console and Supabase, then test
