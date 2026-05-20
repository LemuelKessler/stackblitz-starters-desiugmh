import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iskpwegguknpxamfhgbt.supabase.co';
const supabaseKey = 'sb_publishable_Jd_QLxuKjyRANbTA7u3p8A_BBvmlZjf';

export const supabase = createClient(supabaseUrl, supabaseKey);
