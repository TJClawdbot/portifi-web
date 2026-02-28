import { createClient } from '@/lib/supabase/server'
import SettingsClient from './settings-client'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: holdings } = await supabase.from('holdings').select('*').eq('user_id', user!.id)
  return <SettingsClient user={user!} holdingsCount={holdings?.length || 0} />
}
