const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://olsmghkgtmadahvhysly.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sc21naGtndG1hZGFodmh5c2x5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1ODgwNDEsImV4cCI6MjA4NzE2NDA0MX0.Zu3pTA9lOcL1ATu83ORt8RxDt1VisMrc8IUUPHKXfLU');

async function test() {
  try {
    const { data: data1, error: error1 } = await supabase
        .from('staff')
        .select(`
            *
        `)
        .limit(1);
        
    console.log("Q1 Error:", error1?.message || error1);
    console.log("Q1 Data:", JSON.stringify(data1, null, 2));

  } catch(e) {
    console.log("Exception:", e);
  }
}
test();
