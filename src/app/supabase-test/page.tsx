import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: startups, error } = await supabase.from('startups').select('id, name, sector, stage')

  if (error) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
        <h1 style={{ color: '#ef4444' }}>Supabase Connection Error</h1>
        <pre>{JSON.stringify(error, null, 2)}</pre>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ color: '#10b981' }}>Supabase Connection: Success</h1>
      <p>Successfully queried the <code>startups</code> table.</p>
      <h2>Startups List ({startups?.length || 0})</h2>
      {startups && startups.length > 0 ? (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {startups.map((startup) => (
            <li key={startup.id} style={{ padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '0.5rem' }}>
              <strong>{startup.name}</strong> - {startup.sector} ({startup.stage})
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ color: '#64748b' }}>No startups found in the database. You can publish one from the app dashboard.</p>
      )}
    </div>
  )
}

