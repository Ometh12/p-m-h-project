import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://erhcubnfuvrlytfptiyay.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_lQZX67029pxet0bEXTppZQ_o6DL_LFq'; // Paste your sb_publishable_ key here

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);