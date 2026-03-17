const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://olsmghkgtmadahvhysly.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sc21naGtndG1hZGFodmh5c2x5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1ODgwNDEsImV4cCI6MjA4NzE2NDA0MX0.Zu3pTA9lOcL1ATu83ORt8RxDt1VisMrc8IUUPHKXfLU');

async function test() {
  try {
    const storeId = '82a22a88-784e-4149-b9b0-8cac2259f7b5'; // from earlier logs
    const mockStaff = {
        store_id: storeId,
        name: 'Test Staff 2',
        role: 'Test Role',
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

    console.log("Inserting staff WITHOUT returning...");
    const { data, error } = await supabase
        .from('staff')
        .insert([mockStaff]);
        // no .select() here!
        
    console.log("Insert Error:", JSON.stringify(error, null, 2));
    console.log("Insert Data:", data);

    console.log("Inserting staff WITH limited returning...");
    const { data: d2, error: e2 } = await supabase
        .from('staff')
        .insert([mockStaff])
        .select(`id, name, store_id`);
        // specific select
        
    console.log("Insert2 Error:", JSON.stringify(e2, null, 2));

  } catch(e) {
    console.log("Exception:", e);
  }
}
test();
