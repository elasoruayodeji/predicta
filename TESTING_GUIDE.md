# Quick Testing Guide - Supabase Integration

## Prerequisites

1. **Environment Variables** - Ensure `.env` has:
   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   INVESTO_API_KEY=your-investo-key
   ```

2. **Database Migration** - Ensure migration has been run:
   - Go to Supabase Dashboard → SQL Editor
   - Run the migration from `supabase/migrations/001_initial_schema.sql`
   - Verify all 12 tables exist

3. **Start Dev Server**:
   ```bash
   npm run dev
   ```

---

## Test 1: Create New Account

1. Open http://localhost:5173
2. You should see the **Sign In** page
3. Click **"Sign up"** link at bottom
4. Fill in the form:
   - Full Name: `Test User`
   - Email: `test@example.com`
   - Password: `test123456` (min 6 chars)
5. Click **"Create Account"**
6. **Expected Result:**
   - Success message: "Account created! Please check your email..."
   - Form switches to sign in mode

7. **Verify in Supabase Dashboard:**
   - Go to **Authentication** → **Users**
   - Find `test@example.com` in the list
   - Click on the user
   - Verify **Email** is set
   - Verify **Raw user meta data** contains `full_name: "Test User"`

8. **Verify Database Records:**
   - Go to **Table Editor**
   - Check **profiles** table:
     - Should have record with `id` matching user ID
     - `full_name` should be "Test User"
     - `email` should be "test@example.com"
   - Check **user_settings** table:
     - Should have record with `user_id` matching user ID
     - All default values should be set (theme: 'dark', currency: 'NGN', etc.)
   - Check **watchlists** table:
     - Should have "My Watchlist" record
   - Check **portfolio_accounts** table:
     - Should have "My Portfolio" record

---

## Test 2: Sign In

1. On the sign in page, enter:
   - Email: `test@example.com`
   - Password: `test123456`
2. Click **"Sign In"**
3. **Expected Result:**
   - Redirected to Dashboard
   - User email appears in header (top right)
   - "Cloud Sync" indicator shows (green cloud icon)
   - Sign out button visible (logout icon)

---

## Test 3: Profile Update

1. Click **Settings** in sidebar
2. You should be on **Profile** tab
3. Change **Full Name** to `Updated Test User`
4. Click **"Save Changes"** button
5. **Expected Result:**
   - Button shows "Saving..." with spinner
   - Toast appears: "Saving to cloud..."
   - Toast changes to: "Saved to cloud" (green)
   - Toast disappears after 3 seconds

6. **Verify in Supabase Dashboard:**
   - Go to **Table Editor** → **profiles**
   - Find your user record
   - Verify `full_name` is now "Updated Test User"

7. **Test Persistence:**
   - Refresh the page (F5)
   - Go to Settings → Profile
   - **Expected:** Name should still be "Updated Test User"

---

## Test 4: Theme Persistence

1. Go to **Settings** → **Appearance**
2. Click **Light** theme button
3. **Expected Result:**
   - Toast: "Saving to cloud..."
   - Toast: "Saved to cloud"
   - Theme changes to light mode immediately

4. **Verify in Supabase Dashboard:**
   - Go to **Table Editor** → **user_settings**
   - Find your user record
   - Verify `theme` is now 'light'

5. **Test Persistence:**
   - Refresh the page (F5)
   - **Expected:** Theme should still be light

6. **Test Cross-Device Sync:**
   - Open app in another browser/incognito window
   - Sign in with same account
   - **Expected:** Theme should be light (synced from cloud)

---

## Test 5: Settings Persistence

1. Go to **Settings** → **Preferences**
2. Change settings:
   - Currency: **USD**
   - Date Format: **DD/MM/YYYY**
   - Time Format: **12-hour**
   - Timezone: **UTC**
3. **Expected Result:**
   - Each change shows "Saved to cloud" toast
   - Settings update immediately

4. **Verify in Supabase Dashboard:**
   - Go to **Table Editor** → **user_settings**
   - Find your user record
   - Verify:
     - `currency` = 'USD'
     - `date_format` = 'DD/MM/YYYY'
     - `time_format` = '12h'
     - `timezone` = 'UTC'

5. **Test Persistence:**
   - Refresh the page (F5)
   - Go to Settings → Preferences
   - **Expected:** All settings should persist

---

## Test 6: Sign Out

1. Click the **sign out button** (logout icon) in header
2. **Expected Result:**
   - Redirected to Sign In page
   - User email no longer in header
   - "Cloud Sync" indicator gone

3. **Verify Data Isolation:**
   - Sign in with a different account (create new one)
   - Go to Settings → Profile
   - **Expected:** Should see new user's profile, not previous user's

---

## Test 7: Offline Mode (No Supabase)

1. **Temporarily remove Supabase config:**
   - Edit `.env`
   - Comment out or remove:
     ```bash
     # VITE_SUPABASE_URL=...
     # VITE_SUPABASE_ANON_KEY=...
     ```
   - Restart dev server: `npm run dev`

2. **Expected Result:**
   - App loads without showing auth page
   - "Local Only" indicator shows in header (orange cloud-off icon)
   - No user email in header
   - No sign out button

3. **Test Local Storage:**
   - Go to Settings → Preferences
   - Change currency to **GBP**
   - **Expected:** Toast shows "Saved locally"
   - Refresh page
   - **Expected:** Currency should still be GBP (from localStorage)

4. **Restore Supabase config:**
   - Uncomment the env variables
   - Restart dev server

---

## Test 8: Error Handling

1. **Test Invalid Login:**
   - Go to sign in page
   - Enter wrong password
   - Click "Sign In"
   - **Expected:** Error message "Invalid email or password"

2. **Test Weak Password:**
   - Go to sign up page
   - Enter password less than 6 chars
   - Click "Create Account"
   - **Expected:** Form validation prevents submission

3. **Test Duplicate Email:**
   - Sign up with email that already exists
   - **Expected:** Error message about user already existing

---

## Test 9: Row Level Security (RLS)

1. **Create Two Test Accounts:**
   - Account A: `userA@test.com` / `password123`
   - Account B: `userB@test.com` / `password123`

2. **Test Data Isolation:**
   - Sign in as User A
   - Go to Settings → Profile
   - Change name to "User A Name"
   - Save
   - Sign out

   - Sign in as User B
   - Go to Settings → Profile
   - **Expected:** Should see User B's profile (empty or different name)
   - **Should NOT see:** "User A Name"

3. **Verify in Supabase Dashboard:**
   - Go to **Table Editor** → **profiles**
   - Should see two separate records
   - Each with correct user data
   - RLS policies preventing cross-user access

---

## Test 10: Existing User Migration

If you have existing Supabase users created before the migration:

1. **Sign in with existing user**
2. **Expected Result:**
   - App doesn't crash
   - May see empty profile/settings

3. **Update Profile:**
   - Go to Settings → Profile
   - Enter full name
   - Click "Save Changes"
   - **Expected:** Creates profile record if missing

4. **Verify in Supabase Dashboard:**
   - Check **profiles** table
   - Should now have record for this user
   - Check **user_settings** table
   - Should have record with defaults

---

## Common Issues & Solutions

### Issue: "Supabase Not Configured" message
**Solution:**
- Check `.env` file has correct values
- Restart dev server after changing `.env`
- Verify no typos in variable names

### Issue: Sign up succeeds but no database records
**Solution:**
- Check database trigger exists:
  ```sql
  SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
  ```
- If missing, re-run the migration
- Check trigger function exists:
  ```sql
  SELECT * FROM pg_proc WHERE proname = 'handle_new_user';
  ```

### Issue: "Saved to cloud" but data not in Supabase
**Solution:**
- Check browser console for errors
- Check Supabase Dashboard → Logs → API logs
- Verify RLS policies allow INSERT/UPDATE
- Check user is actually authenticated (not in offline mode)

### Issue: Theme doesn't persist after refresh
**Solution:**
- Check ThemeContext is loading from cloud on mount
- Verify user_settings record exists in Supabase
- Check browser console for errors
- Verify `theme` column exists in user_settings table

### Issue: Profile name doesn't update
**Solution:**
- Check "Save Changes" button is clicked (not just typing)
- Verify profiles table has record for user
- Check RLS policy allows UPDATE on profiles
- Check browser console for errors

---

## Success Criteria

✅ All 10 tests pass  
✅ No console errors  
✅ Data persists across page refreshes  
✅ Data syncs across devices  
✅ RLS prevents cross-user access  
✅ Offline mode works when Supabase unavailable  
✅ Error messages are clear and helpful  

---

## Next Steps After Testing

If all tests pass:
1. ✅ Authentication is working
2. ✅ Profile management is working
3. ✅ Settings persistence is working
4. ✅ Cloud sync is working
5. ✅ Security (RLS) is working

**Next Phase:** Update remaining components to use cloud storage:
- WatchlistPage
- PortfolioTracker
- AlertsPage
- InvestmentCalendar
- InvestmentJournal
- ReportsPage
- StockScreener

Follow the pattern in SettingsPage.tsx:
```typescript
const { user, isConfigured } = useAuth();

// Load from cloud
useEffect(() => {
  if (user && isConfigured) {
    const data = await getDataService().getItems(user.id);
    // Update state
  }
}, [user, isConfigured]);

// Save to cloud
const handleSave = async (item) => {
  if (user && isConfigured) {
    await getDataService().saveItem(user.id, item);
  } else {
    // Fallback to localStorage
  }
};
```

---

## Troubleshooting Commands

```bash
# Check if Supabase is configured
grep VITE_SUPABASE .env

# Restart dev server
npm run dev

# Clear browser cache
# Ctrl+Shift+R (hard refresh)

# Check Supabase connection
# Open browser console and run:
# supabase.auth.getSession().then(console.log)

# Check database tables
# Supabase Dashboard → Table Editor → Select table

# Check auth users
# Supabase Dashboard → Authentication → Users

# Check logs
# Supabase Dashboard → Logs → API logs
```

---

## Support

If tests fail:
1. Check browser console for errors
2. Check Supabase Dashboard → Logs
3. Verify environment variables are correct
4. Verify database migration was run
5. Verify RLS policies are applied
6. Check network tab for failed requests

**Documentation:**
- `SUPABASE_FIX_COMPLETE.md` - Full implementation details
- `CLOUD_SETUP_GUIDE.md` - Setup instructions
- `CLOUD_TRANSFORMATION_REPORT.md` - Architecture overview
