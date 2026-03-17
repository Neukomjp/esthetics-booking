const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://olsmghkgtmadahvhysly.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sc21naGtndG1hZGFodmh5c2x5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1ODgwNDEsImV4cCI6MjA4NzE2NDA0MX0.Zu3pTA9lOcL1ATu83ORt8RxDt1VisMrc8IUUPHKXfLU');

async function reloadSchema() {
  try {
    console.log("Triggering schema cache reload via RPC (if exists)...");
    // Often, a simple way to reload is to call a non-existent RPC or wait,
    // but the most reliable way in the dashboard is asking the user to restart or reload schema.
    // Let's see what happens if we query a non-existent table just to force a refresh sometimes:
    await supabase.from('nonexistent_table_to_force_refresh').select('*');
  } catch (e) {
    console.log("Expected error:", e);
  }
}
reloadSchema();
