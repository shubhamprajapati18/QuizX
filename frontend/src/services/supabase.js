import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ctukkfgzyzkpghgjvpwl.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0dWtrZmd6eXprcGdoZ2p2cHdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyOTM1NDMsImV4cCI6MjEwMTg2OTU0M30.tUWHUYAm8cHViJCxqicMy0jg5xWT80VuTRteVl-AtoA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

export default supabase;
