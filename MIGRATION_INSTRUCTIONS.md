# Migration Instructions: Fix User Creation Issue

## Problem
The application is experiencing the following errors:
- 403 Forbidden when trying to access user data
- Foreign key constraint violation when creating templates
- Users are not being created in the `users` table after authentication

## Solution
We've created a migration that:
1. Adds the missing RLS policy for user insertion
2. Creates a function to ensure users exist before operations
3. Updates the template creation process to use proper permissions

## Steps to Apply the Migration

### 1. Access Supabase Dashboard
Go to your Supabase project dashboard at https://app.supabase.com

### 2. Navigate to SQL Editor
Click on "SQL Editor" in the left sidebar

### 3. Execute the Migration
Copy and paste the entire contents of `/workspace/supabase/fix-user-creation.sql` into the SQL editor and click "Run"

### 4. Verify the Migration
After running the migration, verify that:
- The new policies are created
- The functions `ensure_user_exists`, `ensure_current_user_exists`, and updated `create_user_template` exist
- No errors were reported during execution

### 5. Test the Application
1. Clear your browser's local storage and cookies for the application
2. Sign out if you're currently signed in
3. Sign in again with Google authentication
4. Try creating a new template - it should work without errors

## What Changed in the Code

### Database Changes
- Added `Users can insert own profile` policy to allow users to create their own records
- Created `ensure_user_exists()` function that safely creates user records
- Updated `create_user_template()` to call `ensure_user_exists()` first
- Created `ensure_current_user_exists()` RPC function for client-side calls

### Application Code Changes
- Updated `databaseService.ts` to use the RPC function instead of direct insertion
- Updated `AuthContext.tsx` to ensure users exist when they authenticate

## Rollback (if needed)
If you need to rollback these changes:

```sql
-- Drop the new policies and functions
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP FUNCTION IF EXISTS public.ensure_user_exists();
DROP FUNCTION IF EXISTS public.ensure_current_user_exists();

-- Restore original create_user_template function
-- (Copy from your original supabase-setup.sql file)
```

## Additional Notes
- This migration is safe to run multiple times
- Existing users will not be affected
- The migration ensures backward compatibility