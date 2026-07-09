const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ktnoogfclgvwzmscefjc.supabase.co';
const supabaseKey = 'sb_secret_48DRRk-D2GIBEB_kd0uNmA_9n4YlY19';

const adminAuthClient = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  console.log("Attempting to fetch pg_policies...");
  const { data, error } = await adminAuthClient
    .from('pg_policies')
    .select('*')
    .eq('tablename', 'objects');
    
  if (error) {
    console.error("Error fetching pg_policies:", error.message);
  } else {
    console.log("Policies:", data);
  }
}

main();
