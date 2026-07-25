-- Migration to allow admin to update a user's full_name in auth.users
-- This is necessary to sync the Full Legal Name after KYC approval.

CREATE OR REPLACE FUNCTION admin_update_user_name(target_email text, new_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Runs as the definer (admin) to bypass RLS/Auth limitations
AS $$
BEGIN
    UPDATE auth.users
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('full_name', new_name, 'kyc_name', new_name, 'kycStatus', 'Approved')
    WHERE email = target_email;
END;
$$;
