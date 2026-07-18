-- Change board_seat from INTEGER to TEXT to allow 'Observer'
ALTER TABLE public.negotiation_versions
ALTER COLUMN board_seat TYPE TEXT USING board_seat::TEXT;
