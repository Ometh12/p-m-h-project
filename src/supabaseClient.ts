import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://erhcubnfuvrlytfptiyay.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_lQZX67029pxet0bEXTppZQ_o6DL_LFq'; // Ensure your full key is here

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);