const fs = require('fs');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
const envConfig = dotenv.parse(fs.readFileSync('.env.local'))
const supabase = createClient(envConfig.NEXT_PUBLIC_SUPABASE_URL, envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testInsert() {
    console.log("Signing in (or up)...");
    const email = `test_${Date.now()}@example.com`;
    const { data: authData, error: authErr } = await supabase.auth.signUp({
        email,
        password: 'password123'
    });
    
    if (authErr) {
        console.log("Signup failed, falling back to login attempt");
        const { data: loginData } = await supabase.auth.signInWithPassword({
            email: 'admin@example.com', 
            password: 'password'
        });
        if (!authData.session && !loginData?.session) {
            console.log("Cannot authenticate to test RLS");
            return;
        }
    }
    
    console.log("Authenticated.");

    const storeId = '82a22a88-784e-4149-b9b0-8cac2259f7b5';
    const mockStaff = {
        store_id: storeId,
        name: 'Final Test',
        role: 'Tester',
        bio: 'Testing all columns',
        specialties: ['cut'],
        service_ids: [],
        instagram_url: '',
        greeting_message: 'Hi',
        years_of_experience: 1,
        tags: [],
        images: [],
        back_margin_rate: 10,
        user_id: 'test_user',
        nomination_fee: 1000,
        age: 20,
        height: 160,
        bust: 80,
        cup: 'A',
        waist: 60,
        hip: 80,
        class_rank: 'Gold',
        twitter_url: 'https://twitter.com',
        is_new_face: false
    };

    console.log("Attempting insert...");
    const { data, error } = await supabase
        .from('staff')
        .insert([mockStaff])
        .select();
        
    console.log("=> Error:", JSON.stringify(error, null, 2));
    if(data) console.log("=> Success Data:", data);
}

testInsert();
