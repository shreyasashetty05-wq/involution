import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
    const { data: tables, error } = await supabase.rpc('get_tables'); // Or try to query information_schema if allowed
    if (error) {
        console.error(error);
    } else {
        console.log("Tables:", tables);
    }
}
run();
