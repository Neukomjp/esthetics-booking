const https = require('https');

const options = {
  hostname: 'olsmghkgtmadahvhysly.supabase.co',
  port: 443,
  path: '/rest/v1/staff',
  method: 'POST',
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sc21naGtndG1hZGFodmh5c2x5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1ODgwNDEsImV4cCI6MjA4NzE2NDA0MX0.Zu3pTA9lOcL1ATu83ORt8RxDt1VisMrc8IUUPHKXfLU',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sc21naGtndG1hZGFodmh5c2x5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1ODgwNDEsImV4cCI6MjA4NzE2NDA0MX0.Zu3pTA9lOcL1ATu83ORt8RxDt1VisMrc8IUUPHKXfLU',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  }
};

const req = https.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk}`);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

const mockStaff = {
    store_id: '82a22a88-784e-4149-b9b0-8cac2259f7b5',
    name: 'Raw Test Full',
    role: 'Test',
    bio: 'Test Bio',
    specialties: ['cut'],
    service_ids: [],
    instagram_url: '',
    greeting_message: 'Hello',
    years_of_experience: 5,
    tags: [],
    images: [],
    back_margin_rate: 46,
    user_id: null,
    nomination_fee: 1000,
    age: 22,
    height: 160,
    bust: 26,
    cup: 'D',
    waist: 34,
    hip: 53,
    class_rank: null,
    twitter_url: null,
    is_new_face: false
};

req.write(JSON.stringify(mockStaff));
req.end();
