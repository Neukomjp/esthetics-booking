const https = require('https');

const options = {
  hostname: 'hgpkvuyzpdpplniksyoi.supabase.co',
  port: 443,
  path: '/rest/v1/staff?columns=%22store_id%22%2C%22name%22%2C%22role%22%2C%22bio%22%2C%22avatar_url%22%2C%22specialties%22%2C%22service_ids%22%2C%22instagram_url%22%2C%22greeting_message%22%2C%22years_of_experience%22%2C%22tags%22%2C%22images%22%2C%22back_margin_rate%22%2C%22user_id%22%2C%22nomination_fee%22%2C%22age%22%2C%22height%22%2C%22bust%22%2C%22cup%22%2C%22waist%22%2C%22hip%22%2C%22class_rank%22%2C%22twitter_url%22%2C%22is_new_face%22&select=*',
  method: 'POST',
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sc21naGtndG1hZGFodmh5c2x5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1ODgwNDEsImV4cCI6MjA4NzE2NDA0MX0.Zu3pTA9lOcL1ATu83ORt8RxDt1VisMrc8IUUPHKXfLU',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sc21naGtndG1hZGFodmh5c2x5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1ODgwNDEsImV4cCI6MjA4NzE2NDA0MX0.Zu3pTA9lOcL1ATu83ORt8RxDt1VisMrc8IUUPHKXfLU',
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(`RESPONSE:`, data);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

const mockStaff = {
    store_id: '82a22a88-784e-4149-b9b0-8cac2259f7b5',
    name: 'Raw Test Full 2',
    role: 'Test'
};

req.write(JSON.stringify(mockStaff));
req.end();
