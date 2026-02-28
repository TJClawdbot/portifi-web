import { createClient } from '@/lib/supabase/server'
import AnalysisClient from './analysis-client'

export default async function AnalysisPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: holdings } = await supabase.from('holdings').select('*').eq('user_id', user!.id)
  return <AnalysisClient holdings={holdings || []} />
}
