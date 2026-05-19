import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dqcyvyaiprkwiwbcyzhv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxY3l2eWFpcHJrd2l3YmN5emh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNDYyODgsImV4cCI6MjA5NDYyMjI4OH0.x-G4UMWJEwFwvLBb_b9lrUQs9YK0BE2KdWQSWvemUv4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storage: AsyncStorage,
  },
});