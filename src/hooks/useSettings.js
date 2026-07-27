import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'

const DEFAULTS = {
  metaMensal: 1500, orcamentoNumero: 0, empresaNome: '', logoDataUrl: '',
  printerCost: 4800, printerLife: 8000, nozzleCost: 200, nozzleLife: 1500,
  energyRate: 1, laborRate: 1, laborHours: 1.5,
}

export function useSettings() {
  const { user } = useAuth()
  const [settings, setSettings] = useState(DEFAULTS)
  const [loading, setLoading] = useState(true)
  // Mirrors `settings` synchronously so `save()` always merges against the latest known
  // value instead of the `settings` snapshot closed over when this `save` reference was
  // created. Without this, two saves fired close together (e.g. tabbing between two
  // fields that both blur-save) can race: the second save builds its payload from a
  // snapshot that doesn't yet include the first save's change, silently clobbering it.
  const settingsRef = useRef(settings)

  const reload = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase.from('settings').select('*').eq('user_id', user.id).maybeSingle()
    if (!error && data) {
      const loaded = {
        metaMensal: Number(data.meta_mensal),
        orcamentoNumero: data.orcamento_numero || 0,
        empresaNome: data.empresa_nome || '',
        logoDataUrl: data.logo_data_url || '',
        printerCost: Number(data.printer_cost ?? DEFAULTS.printerCost),
        printerLife: Number(data.printer_life ?? DEFAULTS.printerLife),
        nozzleCost: Number(data.nozzle_cost ?? DEFAULTS.nozzleCost),
        nozzleLife: Number(data.nozzle_life ?? DEFAULTS.nozzleLife),
        energyRate: Number(data.energy_rate ?? DEFAULTS.energyRate),
        laborRate: Number(data.labor_rate ?? DEFAULTS.laborRate),
        laborHours: Number(data.labor_hours ?? DEFAULTS.laborHours),
      }
      settingsRef.current = loaded
      setSettings(loaded)
    } else if (error) {
      console.error('Erro ao carregar settings', error)
    }
    setLoading(false)
  }, [user])

  useEffect(() => { reload() }, [reload])

  async function save(patch) {
    // Merge against settingsRef.current (updated synchronously, not on the next render)
    // rather than the `settings` state directly, and update it immediately — before the
    // network round trip — so a save started right after this one sees this patch already
    // applied instead of racing it.
    const next = { ...settingsRef.current, ...patch }
    settingsRef.current = next
    setSettings(next)
    const { error } = await supabase.from('settings').upsert({
      user_id: user.id,
      meta_mensal: next.metaMensal,
      orcamento_numero: next.orcamentoNumero,
      empresa_nome: next.empresaNome,
      logo_data_url: next.logoDataUrl,
      printer_cost: next.printerCost,
      printer_life: next.printerLife,
      nozzle_cost: next.nozzleCost,
      nozzle_life: next.nozzleLife,
      energy_rate: next.energyRate,
      labor_rate: next.laborRate,
      labor_hours: next.laborHours,
    }, { onConflict: 'user_id' })
    return { error }
  }

  return { settings, loading, save }
}
