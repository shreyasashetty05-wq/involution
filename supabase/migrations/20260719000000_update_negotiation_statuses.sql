-- Drop existing constraint
ALTER TABLE public.negotiations DROP CONSTRAINT IF EXISTS negotiations_status_check;

-- Add new constraint with all required statuses
ALTER TABLE public.negotiations ADD CONSTRAINT negotiations_status_check CHECK (
    status IN (
        'Initial Offer Available',
        'Waiting for Investor Response',
        'Waiting for Startup Response',
        'Counter Offer Sent',
        'Negotiation Accepted',
        'Negotiation Rejected',
        'Negotiation Locked',
        -- keep old ones just in case
        'Waiting for Startup',
        'Waiting for Investor',
        'Accepted',
        'Rejected',
        'Locked',
        'Ready for Agreement'
    )
);
