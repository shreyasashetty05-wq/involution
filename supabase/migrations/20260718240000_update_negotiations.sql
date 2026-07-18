-- Update negotiation_discussions table to support edit, delete, reply, and read status
ALTER TABLE public.negotiation_discussions
ADD COLUMN is_edited BOOLEAN DEFAULT false,
ADD COLUMN is_deleted BOOLEAN DEFAULT false,
ADD COLUMN read_by_other BOOLEAN DEFAULT false,
ADD COLUMN reply_to UUID REFERENCES public.negotiation_discussions(id) ON DELETE SET NULL;
