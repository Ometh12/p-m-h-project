import { createClient } from '@supabase/supabase-js';

// Clean base URL with no trailing slashes or extra paths
const SUPABASE_URL = 'https://erhcubnfuvryltptiyay.supabase.co'; 
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_lQZX67029pxet0bEXTppZQ_o6DL_LFq'; 

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);