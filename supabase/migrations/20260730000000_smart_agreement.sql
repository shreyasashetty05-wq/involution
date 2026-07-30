-- Add payment fields to startups table
ALTER TABLE public.startups
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS upi_id TEXT,
ADD COLUMN IF NOT EXISTS account_holder_name TEXT,
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS account_number TEXT,
ADD COLUMN IF NOT EXISTS ifsc_code TEXT;

-- Add payment fields to investor_profiles table
ALTER TABLE public.investor_profiles
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS upi_id TEXT,
ADD COLUMN IF NOT EXISTS account_holder_name TEXT,
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS account_number TEXT,
ADD COLUMN IF NOT EXISTS ifsc_code TEXT;

-- Create smart_agreements table
CREATE TABLE public.smart_agreements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
    startup_id TEXT NOT NULL,
    investor_id TEXT NOT NULL,
    status TEXT DEFAULT 'Smart Agreement Started' CHECK (status IN (
        'Smart Agreement Started',
        'Founder Signed',
        'Investor Signed',
        'Signatures Completed',
        'Investor Payment Confirmed',
        'Payment Completed',
        'Deal Completed'
    )),
    founder_signature TEXT,
    founder_signed_at TIMESTAMPTZ,
    investor_signature TEXT,
    investor_signed_at TIMESTAMPTZ,
    investor_payment_confirmed BOOLEAN DEFAULT false,
    investor_payment_confirmed_at TIMESTAMPTZ,
    startup_payment_received BOOLEAN DEFAULT false,
    startup_payment_received_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
