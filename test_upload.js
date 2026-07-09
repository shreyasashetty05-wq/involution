const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ktnoogfclgvwzmscefjc.supabase.co';
const supabaseKey = 'sb_secret_48DRRk-D2GIBEB_kd0uNmA_9n4YlY19';

const adminAuthClient = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  const { data, error } = await adminAuthClient.storage.getBucket('deal-room-files');
  console.log("Bucket data:", data);
}

main();
