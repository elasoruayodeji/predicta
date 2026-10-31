# Authentication Testing Checklist

Use this checklist to thoroughly test PREDICTA's authentication system after configuration.

---

## Pre-Testing Setup

### Required Configuration
- [ ] Supabase project created and configured
- [ ] Email confirmation enabled in Supabase
- [ ] Site URL configured correctly
- [ ] Redirect URLs added for all auth routes
- [ ] Google OAuth configured (optional)
- [ ] Custom SMTP configured (production only)

### Test Environment
- [ ] Development server running (`npm run dev`)
- [ ] Browser cache cleared
- [ ] LocalStorage cleared
- [ ] Multiple browser tabs closed
- [ ] Test email account ready

---

## Test Suite 1: Email Verification Flow

### Test 1.1: Sign Up and Receive Verification Email

**Steps:**
1. Navigate to landing page
2. Click "Get Started" button
3. Fill in sign-up form:
   - Full Name: "Test User"
   - Email: "test@example.com"
   - Password: "test123456"
4. Click "Create Account"
5. Check for success message

**Expected Results:**
- [ ] Success message: "Account created! Please check your email..."
- [ ] Redirected to verification page
- [ ] Verification page shows email address
- [ ] "Resend Verification Email" button visible
- [ ] User appears in Supabase Dashboard → Authentication → Users
- [ ] User has `email_confirmed_at` = NULL (not verified)

**Verification in Supabase:**
```sql
SELECT id, email, email_confirmed_at, created_at
FROM auth.users
WHERE email = 'test@example.com';
```

### Test 1.2: Attempt to Access Dashboard Without Verification

**Steps:**
1. While on verification page, try to navigate to dashboard
2. Try direct URL: http://localhost:5173/dashboard
3. Try accessing any protected route

**Expected Results:**
- [ ] Cannot access dashboard
- [ ] Redirected back to verification page
- [ ] Clear message about email verification required
- [ ] No user data accessible

### Test 1.3: Verify Email via Link

**Steps:**
1. Check email inbox for verification email
   - In development: Check Supabase logs
   - In production: Check actual email
2. Copy verification link from email
3. Open link in browser
4. Wait for verification to complete

**Expected Results:**
- [ ] Verification page shows "Verifying..." state
- [ ] Success message: "Email verified successfully!"
- [ ] Redirected to dashboard after 2 seconds
- [ ] User in Supabase has `email_confirmed_at` set
- [ ] Can access all protected routes
- [ ] No verification warning shown

**Verification in Supabase:**
```sql
SELECT id, email, email_confirmed_at
FROM auth.users
WHERE email = 'test@example.com';
-- email_confirmed_at should now have a timestamp
```

### Test 1.4: Resend Verification Email

**Steps:**
1. Sign up with new account (don't verify)
2. Wait 1-2 minutes
3. Click "Resend Verification Email" button
4. Check for success message
5. Check email inbox for new verification email

**Expected Results:**
- [ ] Button shows loading state
- [ ] Success message: "Verification email sent!"
- [ ] New verification email received
- [ ] New verification link works
- [ ] Old link may or may not work (depends on Supabase settings)

### Test 1.5: Expired Verification Link

**Steps:**
1. Sign up with new account
2. Wait for verification link to expire (default: 24 hours)
   - Or manually invalidate in Supabase
3. Click expired verification link

**Expected Results:**
- [ ] Error message: "Verification failed. The link may have expired."
- [ ] Option to resend verification email
- [ ] Can request new verification link
- [ ] New link works correctly

---

## Test Suite 2: Password Management

### Test 2.1: Forgot Password Flow

**Steps:**
1. Sign out if signed in
2. Go to sign-in page
3. Click "Forgot password?" link
4. Enter email address
5. Click "Send Reset Link"
6. Check for success message

**Expected Results:**
- [ ] Redirected to forgot password page
- [ ] Can enter email address
- [ ] Success message: "Check Your Email"
- [ ] Password reset email received
- [ ] Email contains reset link
- [ ] Link redirects to reset password page

### Test 2.2: Reset Password

**Steps:**
1. Click password reset link from email
2. Verify on reset password page
3. Enter new password (min 6 characters)
4. Confirm new password (must match)
5. Click "Update Password"
6. Wait for success message

**Expected Results:**
- [ ] Reset password page loads
- [ ] Password fields visible with toggle
- [ ] Validation: password min 6 chars
- [ ] Validation: passwords must match
- [ ] Success message: "Password Updated!"
- [ ] Redirected to sign-in page after 3 seconds
- [ ] Can sign in with new password
- [ ] Old password no longer works

### Test 2.3: Invalid Reset Token

**Steps:**
1. Request password reset
2. Wait for link to expire (default: 1 hour)
   - Or manually invalidate in Supabase
3. Click expired reset link

**Expected Results:**
- [ ] Error message: "Invalid Reset Link"
- [ ] Explanation: "This password reset link is invalid or has expired"
- [ ] Button to request new reset link
- [ ] Can request new reset link
- [ ] New link works correctly

### Test 2.4: Password Validation

**Steps:**
1. Go to reset password page
2. Try passwords that don't meet requirements:
   - Less than 6 characters
   - Empty password
   - Passwords that don't match confirmation

**Expected Results:**
- [ ] Error: "Password must be at least 6 characters"
- [ ] Error: "Passwords do not match"
- [ ] Form validation prevents submission
- [ ] Clear error messages shown
- [ ] Cannot submit invalid password

---

## Test Suite 3: Authentication Flow

### Test 3.1: Sign In with Verified Account

**Steps:**
1. Go to sign-in page
2. Enter verified email and password
3. Click "Sign In"
4. Wait for authentication

**Expected Results:**
- [ ] Loading state shown
- [ ] Successfully authenticated
- [ ] Redirected to dashboard
- [ ] User email shown in header
- [ ] "Cloud Sync" indicator visible
- [ ] Sign out button visible
- [ ] Can access all protected routes

### Test 3.2: Sign In with Unverified Account

**Steps:**
1. Sign up with new account (don't verify)
2. Sign out
3. Try to sign in with unverified account

**Expected Results:**
- [ ] Sign in succeeds (Supabase allows it)
- [ ] Redirected to verification page (not dashboard)
- [ ] Cannot access dashboard
- [ ] Clear message about email verification required
- [ ] Can resend verification email

**Note:** This behavior depends on Supabase settings. You can configure Supabase to prevent sign-in for unverified users.

### Test 3.3: Sign In with Invalid Credentials

**Steps:**
1. Go to sign-in page
2. Enter wrong email or password
3. Click "Sign In"

**Expected Results:**
- [ ] Error message: "Invalid email or password"
- [ ] Cannot access dashboard
- [ ] Form remains filled (except password)
- [ ] Can try again with correct credentials

### Test 3.4: Sign Out

**Steps:**
1. Sign in to account
2. Click sign out button in header
3. Wait for sign out to complete

**Expected Results:**
- [ ] Sign out button shows loading state
- [ ] Successfully signed out
- [ ] Redirected to landing page
- [ ] User email no longer shown in header
- [ ] "Cloud Sync" indicator gone
- [ ] Cannot access protected routes
- [ ] Redirected to sign-in page if try to access protected route

### Test 3.5: Session Persistence

**Steps:**
1. Sign in to account
2. Refresh page (F5)
3. Wait for page to reload

**Expected Results:**
- [ ] Still signed in after refresh
- [ ] User email still shown in header
- [ ] Can access protected routes
- [ ] Session persists across page reloads
- [ ] No need to sign in again

### Test 3.6: Multiple Devices

**Steps:**
1. Sign in on Device A (e.g., Chrome)
2. Sign in on Device B (e.g., Firefox) with same account
3. Make changes on Device A
4. Check if changes appear on Device B

**Expected Results:**
- [ ] Can sign in on multiple devices
- [ ] Session is independent per device
- [ ] Cloud data syncs across devices
- [ ] Local data (localStorage) is per device
- [ ] Sign out on one device doesn't affect other

---

## Test Suite 4: Google OAuth

### Test 4.1: Sign Up with Google

**Steps:**
1. Go to sign-up page
2. Click "Sign up with Google" button
3. Complete Google OAuth flow
4. Grant permissions

**Expected Results:**
- [ ] Redirected to Google OAuth
- [ ] Can select Google account
- [ ] Grant permissions screen shown
- [ ] Redirected back to PREDICTA
- [ ] Account created automatically
- [ ] Email automatically verified (Google verifies)
- [ ] Redirected to dashboard
- [ ] User appears in Supabase Users list
- [ ] `email_confirmed_at` is set (auto-verified)

### Test 4.2: Sign In with Google

**Steps:**
1. Sign out
2. Go to sign-in page
3. Click "Sign in with Google" button
4. Complete Google OAuth flow

**Expected Results:**
- [ ] Redirected to Google OAuth
- [ ] Can select same Google account
- [ ] Redirected back to PREDICTA
- [ ] Successfully signed in
- [ ] Redirected to dashboard
- [ ] No duplicate account created

### Test 4.3: Google Account Already Exists

**Steps:**
1. Sign up with Google (creates account)
2. Sign out
3. Try to sign up again with same Google account

**Expected Results:**
- [ ] Recognizes existing account
- [ ] Signs in (not creates new account)
- [ ] Redirected to dashboard
- [ ] No duplicate accounts
- [ ] User data preserved

---

## Test Suite 5: Protected Routes

### Test 5.1: Access Protected Route Without Authentication

**Steps:**
1. Sign out
2. Try to access: http://localhost:5173/dashboard
3. Try to access: http://localhost:5173/portfolio
4. Try to access any protected route

**Expected Results:**
- [ ] Redirected to sign-in page
- [ ] Cannot access protected route
- [ ] After sign in, redirected to originally requested page
- [ ] Clear message about authentication required

### Test 5.2: Access Protected Route Without Verification

**Steps:**
1. Sign up with new account (don't verify)
2. Sign in
3. Try to access dashboard
4. Try to access any protected route

**Expected Results:**
- [ ] Redirected to verification page
- [ ] Cannot access protected routes
- [ ] Clear message about email verification required
- [ ] After verification, can access protected routes

### Test 5.3: Public Routes Accessible Without Auth

**Steps:**
1. Sign out
2. Try to access: http://localhost:5173 (landing page)
3. Try to access: http://localhost:5173/auth (sign-in page)
4. Try to access: http://localhost:5173/auth/forgot-password

**Expected Results:**
- [ ] Landing page accessible
- [ ] Sign-in page accessible
- [ ] Forgot password page accessible
- [ ] No authentication required for public routes
- [ ] No redirect to sign-in

---

## Test Suite 6: Profile Management

### Test 6.1: View Profile Information

**Steps:**
1. Sign in
2. Go to Settings → Profile
3. Check displayed information

**Expected Results:**
- [ ] Full name displayed
- [ ] Email displayed (from Supabase)
- [ ] Email verification status shown (✓ Verified or ⚠ Not verified)
- [ ] Account creation date displayed
- [ ] All information accurate

### Test 6.2: Update Profile Name

**Steps:**
1. Go to Settings → Profile
2. Change full name
3. Click "Save Changes"
4. Wait for save to complete

**Expected Results:**
- [ ] Button shows loading state
- [ ] Success message: "Saved to cloud"
- [ ] Name updated in database
- [ ] Name persists after refresh
- [ ] Name syncs across devices

**Verification in Supabase:**
```sql
SELECT id, email, full_name
FROM public.profiles
WHERE id = '<user-id>';
```

### Test 6.3: Email Field Disabled

**Steps:**
1. Go to Settings → Profile
2. Try to edit email field
3. Check if field is editable

**Expected Results:**
- [ ] Email field is disabled (grayed out)
- [ ] Cannot edit email
- [ ] Message: "Email changes require verification"
- [ ] Email shows verification status

---

## Test Suite 7: Security

### Test 7.1: Row Level Security (RLS)

**Steps:**
1. Sign in as User A
2. Create some data (watchlist, portfolio, etc.)
3. Sign out
4. Sign in as User B
5. Try to access User A's data

**Expected Results:**
- [ ] User B cannot see User A's data
- [ ] User B only sees their own data
- [ ] RLS policies enforced
- [ ] No data leaks between users

**Verification in Supabase:**
```sql
-- Try to access another user's data
SELECT * FROM public.watchlists
WHERE user_id = '<other-user-id>';
-- Should return 0 rows (RLS blocks it)
```

### Test 7.2: Session Security

**Steps:**
1. Sign in
2. Open browser DevTools → Application → Local Storage
3. Check for sensitive data
4. Open DevTools → Network tab
5. Check API requests for sensitive data

**Expected Results:**
- [ ] No passwords in localStorage
- [ ] No API keys in localStorage
- [ ] Session tokens are secure
- [ ] No sensitive data in network requests
- [ ] HTTPS used in production

### Test 7.3: Password Security

**Steps:**
1. Sign up with new account
2. Check Supabase Dashboard → Users
3. Try to view password

**Expected Results:**
- [ ] Password not visible in Supabase
- [ ] Password hashed (bcrypt)
- [ ] Cannot retrieve plaintext password
- [ ] Password securely stored

---

## Test Suite 8: Error Handling

### Test 8.1: Network Errors

**Steps:**
1. Sign in
2. Disable network connection
3. Try to access protected route
4. Try to save settings

**Expected Results:**
- [ ] Clear error message
- [ ] No crash or blank screen
- [ ] Option to retry
- [ ] Graceful degradation

### Test 8.2: Invalid Input

**Steps:**
1. Go to sign-up page
2. Enter invalid email (not email format)
3. Enter short password (< 6 chars)
4. Try to submit

**Expected Results:**
- [ ] Form validation prevents submission
- [ ] Clear error messages
- [ ] Cannot submit invalid data
- [ ] Helpful error messages

### Test 8.3: Supabase Not Configured

**Steps:**
1. Remove Supabase environment variables
2. Restart development server
3. Try to use authentication features

**Expected Results:**
- [ ] Clear message: "Supabase Not Configured"
- [ ] App still works in offline mode
- [ ] localStorage fallback works
- [ ] No crashes or errors

---

## Test Suite 9: Edge Cases

### Test 9.1: Multiple Verification Requests

**Steps:**
1. Sign up
2. Request verification email multiple times
3. Check how many emails received

**Expected Results:**
- [ ] Can request multiple times
- [ ] Each request sends new email
- [ ] No spam or errors
- [ ] Rate limiting may apply (Supabase setting)

### Test 9.2: Concurrent Sessions

**Steps:**
1. Sign in on multiple tabs
2. Sign out on one tab
3. Check other tabs

**Expected Results:**
- [ ] Sign out affects all tabs
- [ ] Other tabs redirect to sign-in
- [ ] Session properly invalidated
- [ ] No stale sessions

### Test 9.3: Browser Back Button

**Steps:**
1. Sign in
2. Navigate to dashboard
3. Click browser back button
4. Click forward button

**Expected Results:**
- [ ] Navigation works correctly
- [ ] No authentication issues
- [ ] State preserved correctly
- [ ] No errors or crashes

---

## Test Suite 10: Mobile Responsiveness

### Test 10.1: Auth Pages on Mobile

**Steps:**
1. Open app on mobile device or mobile emulator
2. Go to sign-in page
3. Go to sign-up page
4. Go to verification page
5. Go to forgot password page

**Expected Results:**
- [ ] All pages responsive
- [ ] Forms usable on mobile
- [ ] Buttons large enough to tap
- [ ] Text readable
- [ ] No horizontal scroll

### Test 10.2: Settings on Mobile

**Steps:**
1. Sign in on mobile
2. Go to Settings → Profile
3. Try to update profile

**Expected Results:**
- [ ] Settings page responsive
- [ ] Profile form usable
- [ ] Save button accessible
- [ ] All features work on mobile

---

## Final Verification

### All Tests Passed?

- [ ] Test Suite 1: Email Verification (5 tests)
- [ ] Test Suite 2: Password Management (4 tests)
- [ ] Test Suite 3: Authentication Flow (6 tests)
- [ ] Test Suite 4: Google OAuth (3 tests)
- [ ] Test Suite 5: Protected Routes (3 tests)
- [ ] Test Suite 6: Profile Management (3 tests)
- [ ] Test Suite 7: Security (3 tests)
- [ ] Test Suite 8: Error Handling (3 tests)
- [ ] Test Suite 9: Edge Cases (3 tests)
- [ ] Test Suite 10: Mobile Responsiveness (2 tests)

**Total: 35 tests**

### Sign-Off

- [ ] All tests passed
- [ ] No critical bugs found
- [ ] Security verified
- [ ] User experience smooth
- [ ] Ready for production

---

## Bug Reporting

If you find bugs during testing, report them with:

1. **Test Case:** Which test failed (e.g., "Test 1.3: Verify Email via Link")
2. **Steps to Reproduce:** Exact steps to reproduce the bug
3. **Expected Result:** What should happen
4. **Actual Result:** What actually happened
5. **Environment:** Browser, device, OS
6. **Screenshots:** If applicable
7. **Console Errors:** Any errors in browser console
8. **Supabase Logs:** Any errors in Supabase logs

---

## Support

- **Supabase Auth Docs:** https://supabase.com/docs/guides/auth
- **Testing Guide:** https://supabase.com/docs/guides/auth/auth-testing
- **Troubleshooting:** See MANUAL_CONFIG_STEPS.md

---

**Testing Status:** ⏳ Ready for testing  
**Last Updated:** 2026  
**Version:** 1.2.0
