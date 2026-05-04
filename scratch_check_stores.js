require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkStores() {
  const { data, error } = await supabase.from('stores').select('*').limit(1)
  if (error) {
    console.error('Error:', error)
  } else {
    if (data.length > 0) {
      console.log('Stores table columns:', Object.keys(data[0]))
    } else {
      console.log('Stores table is empty')
    }
  }
}

checkStores()
