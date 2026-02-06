import { encode, decode, Location } from "@pranamphd/digipin";
import { createClient } from '@/lib/supabase/server';

export async function getIssueWithPin(issueId: number) {
  const supabase = await createClient();

  // 1. Fetch the issue from the 'issues' table
  const { data: issue, error } = await supabase
    .from('issues')
    .select('id, latitude, longitude, status')
    .eq('id', issueId)
    .single();

  if (error || !issue) {
    console.error("Error fetching issue:", error);
    return null;
  }

  // 2. Generate the DigiPIN using the coordinates from your screenshot
  // Note: Ensure the library handles float8 precision correctly
  const location: Location = { 
    latitude: issue.latitude, 
    longitude: issue.longitude 
  };
  
  const digipin = encode(location);

  // 3. Return the combined object for your UI
  return {
    ...issue,
    digipin: digipin // e.g., "MH-MUM-1234"
  };
}