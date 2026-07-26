import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'

const DEFAULTS = { metaMensal: 1500, orcamentoNumero: 0, empresaNome: '', logoDataUrl: '' }

export function useSettings() {
  const { user } = useAuth()
  const [settings, setSettings] = useState(DEFAULTS)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase.from('settings').select('*').eq('user_id', user.id).maybeSingle()
    if (!error && data) {
      setSettings({
        metaMensal: Number(data.meta_mensal),
        orcamentoNumero: data.orcamento_numero || 0,
        empresaNome: data.empresa_nome || '',
        logoDataUrl: data.logo_data_url || '',
      })
    } else if (error) {
      console.error('Erro ao carregar settings', error)
    }
    setLoading(false)
  }, [user])

  useEffect(() => { reload() }, [reload])

  async function save(patch) {
    const next = { ...settings, ...patch }
    const { error } = await supabase.from('settings').upsert({
      user_id: user.id,
      meta_mensal: next.metaMensal,
      orcamento_numero: next.orcamentoNumero,
      empresa_nome: next.empresaNome,
      logo_data_url: next.logoDataUrl,
    }, { onConflict: 'user_id' })
    if (!error) setSettings(next)
    return { error }
  }

  return { settings, loading, save }
}
