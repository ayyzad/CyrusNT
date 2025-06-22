import { createClient } from '@/utils/supabase/server';

export type WebsiteSource = {
  id: number;
  name: string;
  url: string;
  ownership_and_funding: string | null;
  stated_mission: string | null;
  noteworthy_aspects: string | null;
  iran_focused_bias_rating: string | null;
  neutrality_rating: number | null;
  justification_for_bias_rating: string | null;
};

export const getWebsiteSources = async () => {
  const supabase = await createClient();
  const {
    data,
    error
  } = await supabase.from('websites')
    .select(`
      id,
      name,
      url,
      ownership_and_funding,
      stated_mission,
      noteworthy_aspects,
      iran_focused_bias_rating,
      neutrality_rating,
      justification_for_bias_rating
    `)
    .order('name', { ascending: true });

  return {
    data: data as WebsiteSource[] | null,
    error,
  };
};
