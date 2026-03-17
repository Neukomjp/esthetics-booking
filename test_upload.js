const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient('https://olsmghkgtmadahvhysly.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sc21naGtndG1hZGFodmh5c2x5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1ODgwNDEsImV4cCI6MjA4NzE2NDA0MX0.Zu3pTA9lOcL1ATu83ORt8RxDt1VisMrc8IUUPHKXfLU');

async function test() {
  try {
    const fileContent = 'Hello Wordl!';
    const fileName = `uploads/test_${Date.now()}.txt`;
    
    console.log("Uploading...");
    
    // Using simple upload
    const { data, error } = await supabase.storage
        .from('store_assets')
        .upload(fileName, fileContent, {
            contentType: 'text/plain',
            upsert: false
        });
        
    console.log("Upload Error:", JSON.stringify(error, null, 2));
    console.log("Upload Data:", data);

  } catch(e) {
    console.log("Exception:", e);
  }
}
test();
