
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jofjvariyawdjxdjmjwg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_JLnEDYVQMXYEs2J_WbY1GA_-qO_nsgw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
