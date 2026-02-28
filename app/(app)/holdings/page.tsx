import { createClient } from '@/lib/supabase/server'
import HoldingsClient from './holdings-client'

export default async function HoldingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: holdings } = await supabase
    .from('holdings')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  return <HoldingsClient holdings={holdings || []} userId={user!.id} />
}
