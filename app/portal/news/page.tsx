import { createClient } from '@/lib/supabase/server'
import NewsClient from './news-client'

export default async function NewsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: holdings } = await supabase.from('holdings').select('symbol, name').eq('user_id', user!.id)
  const symbols = (holdings || []).map(h => h.symbol)
  return <NewsClient symbols={symbols} />
}
