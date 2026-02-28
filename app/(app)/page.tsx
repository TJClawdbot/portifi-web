import { createClient } from '@/lib/supabase/server'
import DashboardClient from './dashboard-client'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: holdings } = await supabase
    .from('holdings')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  return <DashboardClient holdings={holdings || []} />
}
