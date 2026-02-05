-- ============================================
-- Content Ideas Table
-- Banco de ideias geradas por IA
-- ============================================

CREATE TABLE IF NOT EXISTS public.content_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  
  -- Content details
  title TEXT NOT NULL,
  description TEXT,
  format TEXT CHECK (format IN ('post', 'carousel', 'video', 'story', 'reels', 'article', 'poll', 'thread')),
  platform TEXT CHECK (platform IN ('instagram', 'linkedin', 'facebook', 'tiktok', 'youtube', 'twitter')),
  
  -- Additional metadata
  hook TEXT,
  rationale TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  
  -- Status workflow
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'scheduled', 'used', 'archived')),
  
  -- Tags and categorization
  tags TEXT[] DEFAULT '{}',
  topic TEXT,
  
  -- AI generation metadata
  generated_by TEXT DEFAULT 'ai',
  generation_prompt TEXT,
  
  -- Scheduling
  scheduled_for TIMESTAMPTZ,
  post_id UUID REFERENCES public.content_calendar_posts(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_content_ideas_client_id ON public.content_ideas(client_id);
CREATE INDEX IF NOT EXISTS idx_content_ideas_status ON public.content_ideas(status);
CREATE INDEX IF NOT EXISTS idx_content_ideas_platform ON public.content_ideas(platform);
CREATE INDEX IF NOT EXISTS idx_content_ideas_priority ON public.content_ideas(priority);
CREATE INDEX IF NOT EXISTS idx_content_ideas_created_at ON public.content_ideas(created_at DESC);

-- RLS
ALTER TABLE public.content_ideas ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view content ideas for their clients"
  ON public.content_ideas
  FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM public.user_profiles WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND user_type IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can insert content ideas"
  ON public.content_ideas
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND user_type IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update content ideas"
  ON public.content_ideas
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND user_type IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can delete content ideas"
  ON public.content_ideas
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND user_type IN ('admin', 'super_admin')
    )
  );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_content_ideas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_content_ideas_updated_at ON public.content_ideas;
CREATE TRIGGER trigger_content_ideas_updated_at
  BEFORE UPDATE ON public.content_ideas
  FOR EACH ROW
  EXECUTE FUNCTION update_content_ideas_updated_at();

-- Comment
COMMENT ON TABLE public.content_ideas IS 'Banco de ideias de conteúdo geradas por IA';
