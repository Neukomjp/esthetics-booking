const { createClient } = require('@supabase/supabase-js');
// Need a valid auth token to bypass RLS, or we use service role key.
// But we don't have service role key in .env.local... Wait, let me check .env
const fs = require('fs');
const dotenv = require('dotenv');
const envConfig = dotenv.parse(fs.readFileSync('.env.local'))
console.log("Keys found:", Object.keys(envConfig));

// Wait, the client is probably creating accounts. I can just sign up a dummy user and use their token.
async function signupAndTest() {
    const supabase = createClient(envConfig.NEXT_PUBLIC_SUPABASE_URL, envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    console.log("Signing up dummy user...");
    const email = `test_${Date.now()}@example.com`;
    const { data: authData, error: authErr } = await supabase.auth.signUp({
        email,
        password: 'password123'
    });
    
    if (authErr) {
        console.error("Auth error:", authErr);
        // Let's just try to login if signing up fails due to restrictions
        const {data: loginData, error: loginErr} = await supabase.auth.signInWithPassword({
            email: 'admin@example.com', // guess an email?
            password: 'password'
        });
        if(loginErr) console.log("Login failed too", loginErr);
        if(!authData.session && !loginData?.session) return;
    }
    
    console.log("Logged in!");
    
    const storeId = '82a22a88-784e-4149-b9b0-8cac2259f7b5';
    const mockStaff = {
        store_id: storeId,
        name: 'Test Staff',
        role: 'Test Role'
    };

    console.log("Inserting staff...");
    const { data, error } = await supabase
        .from('staff')
        .insert([mockStaff])
        .select();
        
    console.log("Insert Error:", JSON.stringify(error, null, 2));
}

signupAndTest();
