import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// Root page: redirect authenticated users to the dashboard, unauthenticated to login.
export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/portal')
  } else {
    redirect('/login')
  }
}
