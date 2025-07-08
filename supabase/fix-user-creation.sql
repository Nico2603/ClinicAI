-- Fix for user creation and template creation issues
-- This migration adds missing policies and ensures users can be created properly

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Create policy to allow users to insert their own record
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Function to ensure user exists before any operation
CREATE OR REPLACE FUNCTION public.ensure_user_exists()
RETURNS void AS $$
DECLARE
  user_auth_id uuid;
  user_email text;
  user_metadata jsonb;
BEGIN
  -- Get the current user's auth ID
  user_auth_id := auth.uid();
  
  IF user_auth_id IS NULL THEN
    RAISE EXCEPTION 'No authenticated user';
  END IF;
  
  -- Get user metadata from auth.users
  SELECT email, raw_user_meta_data 
  INTO user_email, user_metadata
  FROM auth.users 
  WHERE id = user_auth_id;
  
  -- Insert user if it doesn't exist
  INSERT INTO public.users (id, email, name, image, phone_number)
  VALUES (
    user_auth_id, 
    user_email,
    COALESCE(user_metadata->>'full_name', user_metadata->>'name'),
    user_metadata->>'avatar_url',
    user_metadata->>'phone_number'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.users.name),
    image = COALESCE(EXCLUDED.image, public.users.image),
    updated_at = now();
    
  -- Create default template if needed
  PERFORM public.create_default_user_template(user_auth_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the create_user_template function to ensure user exists
CREATE OR REPLACE FUNCTION public.create_user_template(
    template_name text,
    template_content text
)
RETURNS uuid AS $$
DECLARE
    new_template_id uuid;
    template_count integer;
BEGIN
    -- Ensure user exists first
    PERFORM public.ensure_user_exists();
    
    -- Count existing templates
    SELECT COUNT(*) INTO template_count 
    FROM public.user_templates 
    WHERE user_id = auth.uid();
    
    -- Generate name if not provided
    IF template_name IS NULL OR template_name = '' THEN
        template_name := 'Plantilla ' || (template_count + 1)::text;
    END IF;
    
    -- Create the new template
    INSERT INTO public.user_templates (name, content, user_id, is_active)
    VALUES (template_name, template_content, auth.uid(), true)
    RETURNING id INTO new_template_id;
    
    RETURN new_template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC function to ensure user exists (can be called from client)
CREATE OR REPLACE FUNCTION public.ensure_current_user_exists()
RETURNS void AS $$
BEGIN
  PERFORM public.ensure_user_exists();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.ensure_user_exists() TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_current_user_exists() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_template(text, text) TO authenticated;