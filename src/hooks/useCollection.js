import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { TABLES, rowToObj, objToRow } from '@/lib/tables'
import { newId } from '@/lib/format'

export function useCollection(key) {
  const { user } = useAuth()
  const table = TABLES[key]
  const orderCol = key === 'orders' ? 'criado_em' : 'created_at'
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const reload = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data: rows, error: fetchError } = await supabase
      .from(table.name).select('*').eq('user_id', user.id).order(orderCol, { ascending: true })
    if (!fetchError) {
      setData((rows || []).map(r => rowToObj(r, table.fields)))
      setError(null)
    } else {
      // Keep `data` as whatever it last successfully held instead of clearing it — a
      // failed reload (offline, Supabase hiccup) shouldn't make an account with real data
      // look empty. `error` is surfaced by the pages so the user knows this isn't really
      // an empty account.
      console.error('Erro ao carregar', key, fetchError)
      setError(fetchError)
    }
    setLoading(false)
  }, [user, table, orderCol, key])

  useEffect(() => { reload() }, [reload])

  async function add(partialItem) {
    const item = { id: newId(), ...partialItem }
    const row = { ...objToRow(item, table.fields), user_id: user.id }
    const { error } = await supabase.from(table.name).insert(row)
    if (!error) setData(prev => [...prev, item])
    return { error, item }
  }

  async function update(id, patch) {
    const row = objToRow(patch, table.fields)
    const { error } = await supabase.from(table.name).update(row).eq('id', id)
    if (!error) setData(prev => prev.map(x => (x.id === id ? { ...x, ...patch } : x)))
    return { error }
  }

  async function remove(id) {
    const { error } = await supabase.from(table.name).delete().eq('id', id)
    if (!error) setData(prev => prev.filter(x => x.id !== id))
    return { error }
  }

  return { data, loading, error, add, update, remove, reload }
}
