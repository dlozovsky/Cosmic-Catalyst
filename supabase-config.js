// Supabase Configuration
// IMPORTANT: This file should be included in .gitignore to prevent exposing keys

// For client-side usage (only use the anon public key here)
const supabaseConfig = {
  supabaseUrl: "https://kutbhhapxjksnuksmykg.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1dGJoaGFweGprc251a3NteWtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExOTc3ODUsImV4cCI6MjA1Njc3Mzc4NX0.sWovBV48QGcNSJmbgaGXtD6-HR7-3xhDg_UsmITDOvg"
};

// NOTE: This file should only contain the public anon key
// The service role key should NEVER be included in client-side code
// and should only be used in secure server environments
