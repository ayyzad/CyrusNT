-- Add analysis columns to websites table
-- Migration: 1734800021_add_website_analysis_columns

ALTER TABLE public.websites 
ADD COLUMN ownership_and_funding TEXT,
ADD COLUMN stated_mission TEXT,
ADD COLUMN noteworthy_aspects TEXT,
ADD COLUMN iran_focused_bias_rating TEXT,
ADD COLUMN neutrality_rating INTEGER CHECK (neutrality_rating >= 1 AND neutrality_rating <= 5),
ADD COLUMN justification_for_bias_rating TEXT;

-- Add comments for clarity
COMMENT ON COLUMN public.websites.ownership_and_funding IS 'Information about the ownership structure and funding sources of the website';
COMMENT ON COLUMN public.websites.stated_mission IS 'The publicly stated mission or purpose of the news organization';
COMMENT ON COLUMN public.websites.noteworthy_aspects IS 'Notable characteristics, history, or distinguishing features';
COMMENT ON COLUMN public.websites.iran_focused_bias_rating IS 'Assessment of bias specifically regarding Iran-related coverage';
COMMENT ON COLUMN public.websites.neutrality_rating IS 'Neutrality rating from 1 (Very Neutral) to 5 (Very Biased)';
COMMENT ON COLUMN public.websites.justification_for_bias_rating IS 'Explanation and justification for the assigned bias rating';
