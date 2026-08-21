import { createClient } from '@supabase/supabase-js';

// Make sure the https:// is inside the quotes!
const SUPABASE_URL = 'https://erhcubnfuvryltptiyay.supabase.co/rest/v1/'; 
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_lQZX67029pxet0bEXTppZQ_o6DL_LFq'; // (Your full key here)

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);