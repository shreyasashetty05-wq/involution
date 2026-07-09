const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ktnoogfclgvwzmscefjc.supabase.co';
const supabaseKey = 'sb_secret_48DRRk-D2GIBEB_kd0uNmA_9n4YlY19';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("--- STARTUPS ---");
  const { data: startups, error: err1 } = await supabase.from('startups').select('id, owner_email, name');
  if (err1) console.error(err1);
  else console.log(startups);

  console.log("\n--- USERS ---");
  const { data: { users }, error: err2 } = await supabase.auth.admin.listUsers();
  if (err2) console.error(err2);
  else {
    users.forEach(u => {
      console.log(`UID: ${u.id}, Email: ${u.email}`);
    });
  }

  console.log("\n--- DEALS ---");
  const { data: deals, error: err3 } = await supabase.from('deals').select('id, startup_id, investor_id');
  if (err3) console.error(err3);
  else console.log(deals);
}

main();
