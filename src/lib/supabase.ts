import { createClient } from '@supabase/supabase-js';

// 하드코딩된 Supabase 설정
const supabaseUrl = 'https://zfnkbhexaozfmxoojsfi.supabase.co';
const supabaseAnonKey = 'sb_publishable_c6-riXPT334AKP3Xk0EQuw_lWSpN9CZ';

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

