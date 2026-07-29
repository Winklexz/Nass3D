import { useState } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DataTable, { textCell } from './DataTable.jsx'

const columns = [{ key: 'nome', label: 'Nome', render: textCell('nome') }]

// Espelha o comportamento real de `useCollection.update`/`.remove` (só atualiza o array local se
// a chamada NÃO devolver erro) — assim os testes de falha abaixo exercitam o mesmo cenário que
// aconteceria de verdade contra o Supabase: prop `rows` não muda quando `onUpdate`/`onRemove`
// falham, e é isso que expõe o bug do input não controlado que o `cellVersions` corrige.
function Harness({ onUpdate, onRemove, initialRows }) {
  const [rows, setRows] = useState(initialRows)

  async function handleUpdate(id, patch) {
    const result = await onUpdate(id, patch)
    if (!result.error) setRows(prev => prev.map(r => (r.id === id ? { ...r, ...patch } : r)))
    return result
  }

  async function handleRemove(id) {
    const result = await onRemove(id)
    if (!result.error) setRows(prev => prev.filter(r => r.id !== id))
    return result
  }

  return (
    <DataTable
      columns={columns}
      rows={rows}
      onUpdate={handleUpdate}
      onRemove={handleRemove}
      emptyMessage="Nada aqui"
    />
  )
}

describe('DataTable — edição inline (textCell)', () => {
  it('applies the edit and shows no error banner when onUpdate resolves without error', async () => {
    const onUpdate = vi.fn().mockResolvedValue({ error: null })
    const onRemove = vi.fn().mockResolvedValue({ error: null })
    render(<Harness onUpdate={onUpdate} onRemove={onRemove} initialRows={[{ id: '1', nome: 'Filamento Azul' }]} />)

    // A linha aparece duas vezes no DOM (tabela desktop + lista de cartões mobile, escondidas só
    // por CSS/media query — jsdom não aplica CSS, então as duas ficam presentes).
    const inputs = screen.getAllByDisplayValue('Filamento Azul')
    expect(inputs).toHaveLength(2)

    fireEvent.change(inputs[0], { target: { value: 'Filamento Vermelho' } })
    fireEvent.blur(inputs[0])

    await waitFor(() => expect(onUpdate).toHaveBeenCalledWith('1', { nome: 'Filamento Vermelho' }))
    expect(screen.queryByText(/Não consegui salvar/)).not.toBeInTheDocument()
  })

  it('shows the error banner and reverts the input to the saved value when onUpdate fails', async () => {
    const onUpdate = vi.fn().mockResolvedValue({ error: 'network down' })
    const onRemove = vi.fn().mockResolvedValue({ error: null })
    render(<Harness onUpdate={onUpdate} onRemove={onRemove} initialRows={[{ id: '1', nome: 'Filamento Azul' }]} />)

    const inputs = screen.getAllByDisplayValue('Filamento Azul')
    fireEvent.change(inputs[0], { target: { value: 'Edição que vai falhar' } })
    fireEvent.blur(inputs[0])

    expect(await screen.findByText(/Não consegui salvar a alteração/)).toBeInTheDocument()

    // O update falhou, então o Harness nunca atualizou `rows` — o valor real salvo continua sendo
    // 'Filamento Azul'. O DataTable precisa remontar o Input (via bump em `cellVersions`) de volta
    // pro `defaultValue` real, desfazendo visualmente o texto não salvo que o usuário digitou.
    await waitFor(() => {
      expect(screen.getAllByDisplayValue('Filamento Azul')).toHaveLength(2)
    })
    expect(screen.queryByDisplayValue('Edição que vai falhar')).not.toBeInTheDocument()
  })
})

describe('DataTable — exclusão com confirmação', () => {
  it('opens a confirmation dialog on the trash icon and only calls onRemove after confirming', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn().mockResolvedValue({ error: null })
    const onRemove = vi.fn().mockResolvedValue({ error: null })
    render(<Harness onUpdate={onUpdate} onRemove={onRemove} initialRows={[{ id: '1', nome: 'Filamento Azul' }]} />)

    const deleteButtons = screen.getAllByRole('button', { name: 'Excluir' })
    expect(deleteButtons).toHaveLength(2) // ícone na tabela desktop + no cartão mobile

    await user.click(deleteButtons[0])

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Excluir item?')).toBeInTheDocument()
    expect(onRemove).not.toHaveBeenCalled()

    await user.click(within(dialog).getByRole('button', { name: 'Excluir' }))

    await waitFor(() => expect(onRemove).toHaveBeenCalledWith('1'))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('does not call onRemove when the confirmation dialog is cancelled', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn().mockResolvedValue({ error: null })
    const onRemove = vi.fn().mockResolvedValue({ error: null })
    render(<Harness onUpdate={onUpdate} onRemove={onRemove} initialRows={[{ id: '1', nome: 'Filamento Azul' }]} />)

    await user.click(screen.getAllByRole('button', { name: 'Excluir' })[0])
    const dialog = await screen.findByRole('dialog')

    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(onRemove).not.toHaveBeenCalled()
  })
})
