import { useEffect, useMemo, useRef, useState } from 'react'
import { UploadCloud } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useCollection } from '@/hooks/useCollection'
import { useSettings } from '@/hooks/useSettings'
import { calculatePricing } from '@/lib/calc'
import { parseGcode } from '@/lib/gcode'
import { fmtBRL, fmtNum, findClosestMaterial, roundUpTo } from '@/lib/format'
import { generateOrcamentoPdf } from '@/lib/pdf'

const COLOR_DEFAULTS = ['#ff2438', '#35c4d4', '#b06bff', '#35d488']
const MARGIN_PRESETS = [
  { mult: 1.5, tag: 'atacado' },
  { mult: 1.8, tag: 'mínimo' },
  { mult: 2.3, tag: 'recomendado' },
  { mult: 3, tag: 'premium' },
  { mult: 4, tag: 'exclusivo' },
]
const COST_PARTS_META = [
  { key: 'materialCost', label: 'Filamento', color: '#35d488' },
  { key: 'energyCost', label: 'Energia', color: '#ff2438' },
  { key: 'laborCost', label: 'Mão de obra', color: '#35c4d4' },
  { key: 'insumos', label: 'Insumos', color: '#b06bff' },
  { key: 'depreciationTotal', label: 'Depreciação', color: '#ff5b5b' },
  { key: 'riscoValue', label: 'Risco de falha', color: '#ffb734' },
  { key: 'frete', label: 'Frete + embalagem', color: '#9195a0' },
]

export default function Calculadora() {
  const { data: materials, error: materialsError, update: updateMaterial } = useCollection('materials')
  const { error: ordersError, add: addOrder } = useCollection('orders')
  const { add: addProduct, error: productsError } = useCollection('products')
  const { settings, save: saveSettings, error: settingsError } = useSettings()
  const loadError = materialsError || ordersError || productsError || settingsError

  const [rows, setRows] = useState([{ weight: 0, price: 0, colorHex: COLOR_DEFAULTS[0], materialId: '' }])
  const [purgeGrams, setPurgeGrams] = useState(8)
  const [printHours, setPrintHours] = useState(0)
  const [energyRate, setEnergyRate] = useState(settings.energyRate)
  const [printerCost, setPrinterCost] = useState(settings.printerCost)
  const [printerLife, setPrinterLife] = useState(settings.printerLife)
  const [nozzleCost, setNozzleCost] = useState(settings.nozzleCost)
  const [nozzleLife, setNozzleLife] = useState(settings.nozzleLife)
  const [laborRate, setLaborRate] = useState(settings.laborRate)
  const [laborHours, setLaborHours] = useState(settings.laborHours)
  const [insumos, setInsumos] = useState(0)
  const [frete, setFrete] = useState(0)
  const [risco, setRisco] = useState(7)
  const [margin, setMargin] = useState(80)
  const [gcodeStatus, setGcodeStatus] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [stockMsg, setStockMsg] = useState('')
  const [equipStatus, setEquipStatus] = useState(null)
  const [produtoNome, setProdutoNome] = useState('')
  const [produtoStatus, setProdutoStatus] = useState(null)
  const [produtoSalvando, setProdutoSalvando] = useState(false)

  async function handleSalvarProduto() {
    if (!produtoNome.trim()) {
      setProdutoStatus({ type: 'err', text: 'Digite um nome pro produto antes de salvar.' })
      return
    }
    setProdutoSalvando(true)
    const { error } = await addProduct({ nome: produtoNome.trim(), preco: roundedPrice, custo: result.totalCost })
    setProdutoSalvando(false)
    if (error) {
      setProdutoStatus({ type: 'err', text: 'Não consegui salvar o produto agora — tente de novo.' })
    } else {
      setProdutoStatus({ type: 'ok', text: `"${produtoNome.trim()}" salvo em Produtos.` })
      setProdutoNome('')
    }
  }
  const fileInputRef = useRef(null)

  const [priceIsManual, setPriceIsManual] = useState(false)
  const isFirstRender = useRef(true)

  const [sellPriceText, setSellPriceText] = useState(() => calculatePricing({
    colorWeights: rows.map(r => r.weight),
    colorPrices: rows.map(r => r.price),
    purgeGramsPerSwap: purgeGrams,
    printHours, energyRate, printerCost, printerLife, nozzleCost, nozzleLife,
    laborRate, laborHours, insumos, frete, riscoPct: risco, margin,
  }).price.toFixed(2))
  const sellPriceFocused = useRef(false)

  const result = useMemo(() => calculatePricing({
    colorWeights: rows.map(r => r.weight),
    colorPrices: rows.map(r => r.price),
    purgeGramsPerSwap: purgeGrams,
    printHours, energyRate, printerCost, printerLife, nozzleCost, nozzleLife,
    laborRate, laborHours, insumos, frete, riscoPct: risco, margin,
    sellPrice: priceIsManual ? (parseFloat(sellPriceText) || 0) : undefined,
    priceIsManual,
  }), [rows, purgeGrams, printHours, energyRate, printerCost, printerLife, nozzleCost, nozzleLife, laborRate, laborHours, insumos, frete, risco, margin, priceIsManual, sellPriceText])

  const roundedPrice = roundUpTo(result.price, 5)

  // Per the design spec's "critério de pronto": until there's real piece data (weight or
  // print time), the calculator shouldn't show a price built purely from the labor/energy
  // floor seeded from settings. This is a display-only guard — calculatePricing's math is
  // untouched, and normal pricing resumes the instant any weight or hours are entered.
  const totalPieceWeight = rows.reduce((sum, r) => sum + (r.weight || 0), 0)
  const hasPieceData = totalPieceWeight > 0 || printHours > 0
  const displaySellPriceText = hasPieceData ? sellPriceText : '0.00'
  const displayRoundedPrice = hasPieceData ? roundedPrice : 0

  useEffect(() => {
    if (!sellPriceFocused.current) setSellPriceText(result.price.toFixed(2))
  }, [result.price])

  useEffect(() => {
    setPrinterCost(settings.printerCost)
    setPrinterLife(settings.printerLife)
    setNozzleCost(settings.nozzleCost)
    setNozzleLife(settings.nozzleLife)
    setEnergyRate(settings.energyRate)
    setLaborRate(settings.laborRate)
    setLaborHours(settings.laborHours)
  }, [settings.printerCost, settings.printerLife, settings.nozzleCost, settings.nozzleLife, settings.energyRate, settings.laborRate, settings.laborHours])

  async function commitEquipmentField(key, value) {
    if (value === settings[key]) return
    const { error } = await saveSettings({ [key]: value })
    if (error) {
      setEquipStatus({ type: 'err', text: 'Não consegui salvar essa alteração — tente de novo.' })
    } else {
      setEquipStatus(null)
    }
  }

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    setPriceIsManual(false)
  }, [rows, purgeGrams, printHours, energyRate, printerCost, printerLife, nozzleCost, nozzleLife, laborRate, laborHours, insumos, frete, risco, margin])

  function handleSellPriceInput(raw) {
    setPriceIsManual(true)
    setSellPriceText(raw)
  }

  function setColorCount(n) {
    n = Math.max(1, Math.min(4, n))
    setRows(prev => {
      const next = [...prev]
      while (next.length < n) next.push({ weight: 0, price: 0, colorHex: COLOR_DEFAULTS[next.length], materialId: '' })
      return next.slice(0, n)
    })
  }

  function updateRow(i, patch) { setRows(prev => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r))) }

  function handleMaterialSelect(i, materialId) {
    if (!materialId) { updateRow(i, { materialId: '' }); return }
    const m = materials.find(x => x.id === materialId)
    if (m) updateRow(i, { materialId, colorHex: m.cor, price: m.preco })
  }

  function processGcodeText(text, filename) {
    const r = parseGcode(text)
    if (r.timeHours === null && r.weights.length === 0) {
      setGcodeStatus({ type: 'err', text: `Não consegui identificar tempo/peso em "${filename}". Preencha os campos manualmente.` })
      return
    }
    if (r.timeHours !== null) setPrintHours(Math.round(r.timeHours * 100) / 100)
    let matchedCount = 0
    if (r.weights.length > 0) {
      const n = Math.min(4, r.weights.length)
      const newRows = r.weights.slice(0, n).map((w, i) => {
        const hex = r.colors[i]
        const m = hex ? findClosestMaterial(hex, materials) : null
        if (m) matchedCount++
        return { weight: w, price: m ? m.preco : 140, colorHex: m ? m.cor : (hex || COLOR_DEFAULTS[i]), materialId: m ? m.id : '' }
      })
      setRows(newRows)
    }
    const h = r.timeHours !== null ? `${fmtNum(r.timeHours, 2)}h` : '—'
    const wtxt = r.weights.length ? `${r.weights.map(w => fmtNum(w, 1)).join(' + ')} g (${r.weights.length} ${r.weights.length > 1 ? 'cores' : 'cor'})` : '—'
    const colorNote = (r.weights.length > 1 && !r.colorsFound) ? ' — cores reais não encontradas no arquivo, confira as cores nos seletores' : ''
    const matchNote = matchedCount > 0 ? ` · ${matchedCount} ${matchedCount > 1 ? 'materiais vinculados' : 'material vinculado'} automaticamente` : ''
    setGcodeStatus({
      type: 'ok',
      text: `Detectado via ${r.slicer} em "${filename}": ${h} (+5min de nivelamento no cálculo) · ${wtxt}${colorNote}${matchNote}${r.estimated ? ' (peso estimado a partir do comprimento — confira o valor)' : ''}`,
    })
  }

  function handleFileInput(e) {
    const f = e.target.files[0]; if (!f) return
    const reader = new FileReader()
    reader.onload = ev => processGcodeText(ev.target.result, f.name)
    reader.readAsText(f)
  }
  function handleDrop(e) {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]; if (!f) return
    const reader = new FileReader()
    reader.onload = ev => processGcodeText(ev.target.result, f.name)
    reader.readAsText(f)
  }

  async function handleDeductStock() {
    const updates = []
    const failures = []
    for (const row of rows) {
      if (row.materialId) {
        const m = materials.find(x => x.id === row.materialId)
        if (m) {
          const { error } = await updateMaterial(m.id, { estoque: Math.max(0, (m.estoque || 0) - row.weight) })
          if (error) failures.push(m.nome)
          else updates.push(`${m.nome}: -${fmtNum(row.weight, 1)}g`)
        }
      }
    }
    setStockMsg(
      failures.length
        ? `Erro ao atualizar estoque de: ${failures.join(', ')}. Tente de novo.${updates.length ? ` (${updates.join(' · ')} atualizado com sucesso)` : ''}`
        : updates.length
          ? `Estoque atualizado — ${updates.join(' · ')}`
          : 'Nenhum material vinculado nas cores desta peça — selecione um material no seletor de cada cor pra descontar do estoque.'
    )
  }

  const currentMult = 1 + margin / 100
  const clampedMarginPct = Math.max(0, Math.min(100, result.marginOfPricePct))
  const circumference = 314.16
  const ringColor = result.marginOfPricePct < 0 ? '#ff5b5b'
    : result.marginOfPricePct < 30 ? '#ffb734'
    : result.marginOfPricePct < 50 ? '#35c4d4' : '#35d488'

  let badge
  if (result.marginOfPricePct < 0) badge = { text: 'Prejuízo. O preço não cobre o custo.', color: '#ff5b5b' }
  else if (result.marginOfPricePct < 30) badge = { text: `Margem de ${fmtNum(result.marginOfPricePct, 0)}%. Baixa — considere revisar o preço.`, color: '#ffb734' }
  else if (result.marginOfPricePct < 50) badge = { text: `Margem de ${fmtNum(result.marginOfPricePct, 0)}%. Razoável.`, color: '#35c4d4' }
  else if (result.marginOfPricePct < 70) badge = { text: `Margem de ${fmtNum(result.marginOfPricePct, 0)}%. Boa.`, color: '#35d488' }
  else badge = { text: `Margem de ${fmtNum(result.marginOfPricePct, 0)}%. Excelente.`, color: '#35d488' }

  // ---- orçamento form ----
  const [orcCliente, setOrcCliente] = useState('')
  const [orcDescricao, setOrcDescricao] = useState('')
  const [orcMaterial, setOrcMaterial] = useState('')
  const [orcQuantidade, setOrcQuantidade] = useState(1)
  const [orcPrazo, setOrcPrazo] = useState('')
  const [orcValidade, setOrcValidade] = useState('')
  const [orcForma1, setOrcForma1] = useState('')
  const [orcDesconto1, setOrcDesconto1] = useState('')
  const [orcForma2, setOrcForma2] = useState('')
  const [orcDesconto2, setOrcDesconto2] = useState('')
  const [orcObs, setOrcObs] = useState('')
  const [orcStatus, setOrcStatus] = useState(null)
  const [orcSubmitting, setOrcSubmitting] = useState(false)
  const orcSubmittingRef = useRef(false)
  const logoInputRef = useRef(null)
  const [empresaNomeDraft, setEmpresaNomeDraft] = useState(settings.empresaNome)

  useEffect(() => {
    if (orcMaterial.trim()) return
    const names = [...new Set(rows.map(r => materials.find(m => m.id === r.materialId)?.nome).filter(Boolean))]
    if (names.length) setOrcMaterial(names.join(' + '))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, materials])

  useEffect(() => { setEmpresaNomeDraft(settings.empresaNome) }, [settings.empresaNome])

  function handleLogoFile(e) {
    const f = e.target.files[0]; if (!f) return
    if (f.size > 3 * 1024 * 1024) { setOrcStatus({ type: 'err', text: 'Essa imagem é muito grande — use um arquivo de até 3MB.' }); return }
    const reader = new FileReader()
    reader.onload = ev => saveSettings({ logoDataUrl: ev.target.result })
    reader.readAsDataURL(f)
  }

  async function handleExportOrcamento() {
    // orcSubmittingRef is checked/set synchronously, on the very first line, before any await —
    // unlike the orcSubmitting state (which only takes effect once React re-renders) — so a second
    // click landing before the button's disabled prop updates is still blocked. orcSubmitting state
    // stays in sync with it purely to drive that disabled prop.
    if (orcSubmittingRef.current) return
    if (!orcCliente.trim() || !orcDescricao.trim()) {
      setOrcStatus({ type: 'err', text: 'Preencha ao menos o nome do cliente e a descrição do serviço.' })
      return
    }
    orcSubmittingRef.current = true
    setOrcSubmitting(true)
    try {
      const numero = String((settings.orcamentoNumero || 0) + 1).padStart(3, '0')
      try {
        await generateOrcamentoPdf({
          numero, empresa: settings.empresaNome || 'Minha Empresa', logoDataUrl: settings.logoDataUrl,
          cliente: orcCliente.trim(), descricao: orcDescricao.trim(), material: orcMaterial.trim(),
          quantidade: orcQuantidade, prazo: orcPrazo.trim(), validade: orcValidade.trim(),
          forma1: orcForma1.trim(), desc1: parseFloat(orcDesconto1) || 0,
          forma2: orcForma2.trim(), desc2: parseFloat(orcDesconto2) || 0,
          obs: orcObs.trim(), base: result.price,
        })
        const { error: settingsError } = await saveSettings({ orcamentoNumero: (settings.orcamentoNumero || 0) + 1 })
        const { error: orderError } = await addOrder({
          cliente: orcCliente.trim(), telefone: '', item: `#${numero} ${orcDescricao.trim()}${orcQuantidade > 1 ? ` (${orcQuantidade}x)` : ''}`,
          prazo: '', status: 'Orçamento', valor: result.price, criadoEm: new Date().toISOString(),
        })
        if (settingsError || orderError) {
          setOrcStatus({ type: 'err', text: 'PDF exportado, mas não consegui salvar o orçamento na aba Pedidos — tente de novo.' })
        } else {
          setOrcStatus({ type: 'ok', text: 'PDF exportado e orçamento salvo na aba Pedidos.' })
        }
      } catch {
        setOrcStatus({ type: 'err', text: 'Não consegui gerar o PDF agora — tente de novo.' })
      }
    } finally {
      orcSubmittingRef.current = false
      setOrcSubmitting(false)
    }
  }

  const val1 = result.price * (1 - (parseFloat(orcDesconto1) || 0) / 100)
  const val2 = result.price * (1 - (parseFloat(orcDesconto2) || 0) / 100)

  return (
    <div>
      <p className="mb-5 max-w-2xl text-sm text-muted-foreground">
        Preencha os campos com os dados da sua impressão ou arraste o .gcode pra puxar tempo, peso e cor de cada filamento sozinho.
      </p>

      {loadError && (
        <div aria-live="polite" className="mb-5 rounded-lg bg-destructive/10 px-3 py-2.5 text-xs leading-relaxed text-destructive">
          Não consegui carregar seus dados — verifique sua conexão e recarregue a página.
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.15fr_1fr] lg:items-start">
        <div className="space-y-4">
          <Card className="glass-panel p-5">
            <CardContent className="p-0">
              <SectionTitle>Importar do fatiador</SectionTitle>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`flex cursor-pointer items-center gap-3.5 rounded-lg border border-dashed p-5 transition-colors ${dragOver ? 'border-primary bg-primary/10' : 'border-border hover:border-primary hover:bg-primary/5'}`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <UploadCloud size={18} />
                </div>
                <div>
                  <strong className="block text-sm">Arraste o .gcode aqui</strong>
                  <span className="text-xs text-muted-foreground">Bambu Studio, Orca, Prusa ou Cura — puxa tempo, peso e cor sozinho</span>
                </div>
              </div>
              <input ref={fileInputRef} type="file" accept=".gcode,.g,.gco,.txt" className="hidden" onChange={handleFileInput} />
              {gcodeStatus && (
                <div className={`mt-3 rounded-lg border px-3 py-2.5 text-xs leading-relaxed ${gcodeStatus.type === 'ok' ? 'border-success/40 bg-success/10 text-success' : 'border-destructive/40 bg-destructive/10 text-destructive'}`}>
                  {gcodeStatus.text}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-panel p-5">
            <CardContent className="p-0">
              <SectionTitle>Filamento</SectionTitle>
              <Label className="mb-2 block">Número de cores da peça</Label>
              <div className="mb-4 flex gap-1 rounded-lg border border-border bg-white/[0.03] p-1">
                {[1, 2, 3, 4].map(n => (
                  <button key={n} onClick={() => setColorCount(n)}
                    className={`flex-1 rounded-md py-1.5 font-mono text-sm transition-colors ${rows.length === n ? 'bg-primary font-semibold text-white' : 'text-muted-foreground hover:text-foreground'}`}>
                    {n}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {rows.map((row, i) => (
                  <div key={i} className="border-b border-border pb-4 last:border-0 last:pb-0">
                    <div className="mb-2.5 flex items-end gap-2.5">
                      <input type="color" value={row.colorHex} onChange={e => updateRow(i, { colorHex: e.target.value, materialId: '' })}
                        className="h-9 w-10 shrink-0 cursor-pointer rounded border border-border bg-transparent p-1" />
                      <div className="flex-1 space-y-1">
                        <Label className="text-[11px]">Material salvo (opcional)</Label>
                        <Select value={row.materialId || '__none'} onValueChange={v => handleMaterialSelect(i, v === '__none' ? '' : v)}>
                          <SelectTrigger className="h-9"><SelectValue placeholder="Cor/preço manual" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none">Cor/preço manual</SelectItem>
                            {materials.map(m => <SelectItem key={m.id} value={m.id}>{m.nome} — R${fmtNum(m.preco, 0)}/kg</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <Label className="text-[11px]">Peso cor {i + 1} (g)</Label>
                        <Input type="number" step="0.1" min="0" value={row.weight} onChange={e => updateRow(i, { weight: parseFloat(e.target.value) || 0 })} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px]">Preço filamento (R$/kg)</Label>
                        <Input type="number" step="1" min="0" value={row.price} onChange={e => updateRow(i, { price: parseFloat(e.target.value) || 0 })} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {rows.length > 1 && (
                <>
                  <div className="mt-4 rounded-lg border border-primary/25 bg-primary/10 p-3 text-xs leading-relaxed text-muted-foreground">
                    🎨 Trocas de cor geram perda de filamento na purga. Some essa perda por troca abaixo — ela entra automaticamente no custo de material.
                  </div>
                  <div className="mt-3 space-y-1">
                    <Label>Perda de filamento por troca de cor (g)</Label>
                    <Input type="number" step="0.5" min="0" value={purgeGrams} onChange={e => setPurgeGrams(parseFloat(e.target.value) || 0)} />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="glass-panel p-5">
            <CardContent className="p-0">
              <SectionTitle>Impressão</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Tempo de impressão (horas)"><Input type="number" step="0.1" min="0" value={printHours} onChange={e => setPrintHours(parseFloat(e.target.value) || 0)} /></Field>
                <Field label="Energia por hora (R$)"><Input type="number" step="0.1" min="0" value={energyRate} onChange={e => setEnergyRate(parseFloat(e.target.value) || 0)} onBlur={() => commitEquipmentField('energyRate', energyRate)} /></Field>
              </div>
              <p className="mt-2.5 text-xs text-muted-foreground">O cálculo soma automaticamente +5 min ao tempo pra cobrir o nivelamento automático da mesa.</p>
            </CardContent>
          </Card>

          <Card className="glass-panel p-5">
            <CardContent className="p-0">
              <SectionTitle>Depreciação de equipamento</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Valor da impressora (R$)"><Input type="number" step="1" min="0" value={printerCost} onChange={e => setPrinterCost(parseFloat(e.target.value) || 0)} onBlur={() => commitEquipmentField('printerCost', printerCost)} /></Field>
                <Field label="Vida útil (horas)"><Input type="number" step="1" min="1" value={printerLife} onChange={e => setPrinterLife(parseFloat(e.target.value) || 1)} onBlur={() => commitEquipmentField('printerLife', printerLife)} /></Field>
                <Field label="Valor do bico (R$)"><Input type="number" step="1" min="0" value={nozzleCost} onChange={e => setNozzleCost(parseFloat(e.target.value) || 0)} onBlur={() => commitEquipmentField('nozzleCost', nozzleCost)} /></Field>
                <Field label="Vida útil do bico (horas)"><Input type="number" step="1" min="1" value={nozzleLife} onChange={e => setNozzleLife(parseFloat(e.target.value) || 1)} onBlur={() => commitEquipmentField('nozzleLife', nozzleLife)} /></Field>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel p-5">
            <CardContent className="p-0">
              <SectionTitle>Mão de obra</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Valor da sua hora (R$)"><Input type="number" step="0.5" min="0" value={laborRate} onChange={e => setLaborRate(parseFloat(e.target.value) || 0)} onBlur={() => commitEquipmentField('laborRate', laborRate)} /></Field>
                <Field label="Acabamento + montagem (horas)"><Input type="number" step="0.1" min="0" value={laborHours} onChange={e => setLaborHours(parseFloat(e.target.value) || 0)} onBlur={() => commitEquipmentField('laborHours', laborHours)} /></Field>
              </div>
            </CardContent>
          </Card>

          {equipStatus && (
            <p className="text-xs leading-relaxed text-destructive">{equipStatus.text}</p>
          )}

          <Card className="glass-panel p-5">
            <CardContent className="p-0">
              <SectionTitle>Custos extras</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Insumos (R$)"><Input type="number" step="0.5" min="0" value={insumos} onChange={e => setInsumos(parseFloat(e.target.value) || 0)} /></Field>
                <Field label="Frete + embalagem (R$)"><Input type="number" step="0.5" min="0" value={frete} onChange={e => setFrete(parseFloat(e.target.value) || 0)} /></Field>
              </div>
              <div className="mt-3">
                <Field label="Risco de falha (% sobre o custo)"><Input type="number" step="1" min="0" value={risco} onChange={e => setRisco(parseFloat(e.target.value) || 0)} /></Field>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel p-5">
            <CardContent className="p-0">
              <SectionTitle>Margem de lucro</SectionTitle>
              <Label className="mb-2 block">Sugestões de multiplicador</Label>
              <div className="mb-4 grid grid-cols-5 gap-2">
                {MARGIN_PRESETS.map(p => {
                  const active = Math.abs(p.mult - currentMult) < 0.02
                  return (
                    <button key={p.mult} onClick={() => setMargin(Math.round((p.mult - 1) * 100))}
                      className={`flex flex-col items-center gap-0.5 rounded-lg border px-1 py-2.5 transition-colors ${active ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}>
                      <span className={`font-mono text-sm font-semibold ${active ? 'text-primary' : ''}`}>{fmtNum(p.mult, 1)}x</span>
                      <span className={`text-[9px] uppercase ${active ? 'text-primary' : 'text-muted-foreground'}`}>{p.tag}</span>
                    </button>
                  )
                })}
              </div>
              <Field label="Markup sobre o custo (%)">
                <Input type="number" step="1" min="0" value={Math.round(priceIsManual ? result.margin : margin)} onChange={e => setMargin(parseFloat(e.target.value) || 0)} />
              </Field>
              <p className="mt-2 text-xs text-muted-foreground">
                {margin}% de markup = multiplicador de <b className="text-foreground">{fmtNum(currentMult, 2).replace(/,00$/, '')}x</b> sobre o custo total.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="lg:sticky lg:top-6">
          <Card className="glass-panel p-5">
            <CardContent className="p-0">
              <Label className="mb-2.5 block text-[11px] uppercase tracking-wider">Quanto vou cobrar</Label>
              <div className="mb-1.5 flex items-center gap-2.5 rounded-lg border border-border bg-white/[0.03] px-3.5 py-2.5">
                <span className="rounded-md border border-primary/40 bg-primary/15 px-1.5 py-0.5 font-mono text-[10px] text-primary">BRL</span>
                <input
                  type="number" step="0.5" min="0" value={displaySellPriceText}
                  onFocus={() => { sellPriceFocused.current = true }}
                  onBlur={() => { sellPriceFocused.current = false; setSellPriceText(result.price.toFixed(2)) }}
                  onChange={e => handleSellPriceInput(e.target.value)}
                  className="w-full bg-transparent font-ui text-3xl font-bold outline-none"
                />
              </div>
              <div className="mb-4 flex items-center justify-between px-0.5 text-xs text-muted-foreground">
                <span>Arredondado pra cobrar</span>
                <span className="font-mono font-semibold text-foreground">{fmtBRL(displayRoundedPrice)}</span>
              </div>

              <div className="mb-3.5 flex items-center gap-4 rounded-lg border p-4" style={{ borderColor: `${ringColor}40`, background: `linear-gradient(135deg, ${ringColor}18, transparent)` }}>
                <div className="relative h-[92px] w-[92px] shrink-0">
                  <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#2a2c30" strokeWidth="12" />
                    <circle cx="60" cy="60" r="50" fill="none" stroke={ringColor} strokeWidth="12" strokeLinecap="round"
                      strokeDasharray={circumference} strokeDashoffset={circumference * (1 - clampedMarginPct / 100)}
                      style={{ transition: 'stroke-dashoffset .5s cubic-bezier(.4,0,.2,1), stroke .3s ease' }} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="font-ui text-xl font-bold" style={{ color: ringColor }}>{fmtNum(result.marginOfPricePct, 0)}%</div>
                    <div className="font-mono text-[8px] tracking-wide text-muted-foreground">MARGEM</div>
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">Lucro líquido</div>
                  <div className="font-mono text-2xl font-bold" style={{ color: result.profit >= 0 ? '#35d488' : ringColor }}>
                    {result.profit >= 0 ? '+' : ''}{fmtBRL(result.profit)}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">markup de <b className="text-foreground">{fmtNum(result.markupPct, 0)}%</b> sobre o custo</div>
                </div>
              </div>

              <div className="mb-4 flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-sm font-semibold" style={{ color: badge.color, borderColor: `${badge.color}55`, background: `${badge.color}18` }}>
                <span>{result.marginOfPricePct < 30 ? '⚠' : '✓'}</span><span>{badge.text}</span>
              </div>

              <div className="mb-2.5 flex items-baseline justify-between text-[11px] uppercase tracking-wide text-muted-foreground">
                <span>Composição do custo</span>
                <span className="font-mono text-sm font-semibold text-foreground">{fmtBRL(result.totalCost)}</span>
              </div>
              <div className="mb-4 flex h-2.5 overflow-hidden rounded-full">
                {COST_PARTS_META.map(p => {
                  const pct = result.totalCost > 0 ? (result[p.key] / result.totalCost) * 100 : 0
                  return <div key={p.key} style={{ width: `${pct}%`, background: p.color }} />
                })}
              </div>
              <div className="mb-1 space-y-2.5">
                {COST_PARTS_META.map(p => {
                  const pct = result.totalCost > 0 ? (result[p.key] / result.totalCost) * 100 : 0
                  return (
                    <div key={p.key} className="flex items-center justify-between text-[13px]">
                      <span className="flex items-center text-muted-foreground">
                        <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: p.color }} />{p.label}
                      </span>
                      <span className="flex items-center gap-2.5">
                        {pct > 0 && <span className="font-mono text-[11px] text-muted-foreground">{fmtNum(pct, 0)}%</span>}
                        <span className="font-mono">{fmtBRL(result[p.key])}</span>
                      </span>
                    </div>
                  )
                })}
              </div>

              <div className="my-4 h-px bg-border" />
              <Row k="Tempo de máquina (com nivelamento)" v={`${fmtNum(result.hours, 2)}h`} />
              <Row k="Peso total usado (com purga)" v={`${fmtNum(result.totalWeightUsed, 1)} g`} />

              <Button variant="outline" className="mt-3 w-full border-primary text-primary hover:bg-primary hover:text-white" onClick={handleDeductStock}>
                Registrar impressão (descontar do estoque)
              </Button>
              {stockMsg && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{stockMsg}</p>}

              <div className="mt-4 border-t border-border pt-4">
                <Label className="mb-1.5 block text-[11px] uppercase tracking-wider">Salvar como produto</Label>
                <div className="flex gap-2">
                  <Input value={produtoNome} onChange={e => setProdutoNome(e.target.value)} placeholder="Nome do produto" />
                  <Button
                    variant="outline" onClick={handleSalvarProduto} disabled={produtoSalvando}
                    className="shrink-0 border-primary text-primary hover:bg-primary hover:text-white"
                  >
                    Salvar
                  </Button>
                </div>
                {produtoStatus && (
                  <p className={`mt-2 text-xs leading-relaxed ${produtoStatus.type === 'ok' ? 'text-success' : 'text-destructive'}`}>
                    {produtoStatus.text}
                  </p>
                )}
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  Cria em Produtos com preço {fmtBRL(roundedPrice)} (arredondado) e custo {fmtBRL(result.totalCost)}.
                </p>
              </div>

              <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
                Cálculo simples de referência — impostos sobre a venda não estão incluídos. O desconto de estoque considera só o peso por cor vinculado a um material.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="glass-panel mt-4 p-5">
        <CardContent className="p-0">
          <div className="mb-4 flex items-center justify-between border-b border-border pb-2.5">
            <span className="font-ui text-sm font-bold uppercase tracking-wide">📄 Gerar Orçamento em PDF</span>
            <span className="font-mono text-xs text-muted-foreground">#{String((settings.orcamentoNumero || 0) + 1).padStart(3, '0')}</span>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="Logo da sua empresa (opcional)">
              <div onClick={() => logoInputRef.current?.click()}
                className="flex min-h-[78px] cursor-pointer items-center justify-center rounded-lg border border-dashed border-border p-4 text-center transition-colors hover:border-primary hover:bg-primary/5">
                {settings.logoDataUrl
                  ? <img src={settings.logoDataUrl} alt="logo" className="max-h-[60px] max-w-full rounded" />
                  : <div><div className="text-lg">🖼️</div><div className="text-xs text-muted-foreground">Clique para enviar sua logo</div></div>}
              </div>
              <input ref={logoInputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleLogoFile} />
              {settings.logoDataUrl && (
                <button onClick={() => saveSettings({ logoDataUrl: '' })} className="mt-1.5 text-[11px] text-muted-foreground hover:text-destructive">remover logo</button>
              )}
            </Field>
            <Field label="Sua empresa / seu nome">
              <Input
                value={empresaNomeDraft}
                onChange={e => setEmpresaNomeDraft(e.target.value)}
                onBlur={() => { if (empresaNomeDraft !== settings.empresaNome) saveSettings({ empresaNome: empresaNomeDraft }) }}
                placeholder="Ex: João 3D Prints"
              />
            </Field>
          </div>

          <div className="mt-3"><Field label="Nome do cliente"><Input value={orcCliente} onChange={e => setOrcCliente(e.target.value)} placeholder="Ex: Maria Silva" /></Field></div>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="Descrição do serviço"><Input value={orcDescricao} onChange={e => setOrcDescricao(e.target.value)} placeholder="Ex: Suporte para celular" /></Field>
            <Field label="Material"><Input value={orcMaterial} onChange={e => setOrcMaterial(e.target.value)} placeholder="Ex: PLA Branco" /></Field>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="Quantidade"><Input type="number" step="1" min="1" value={orcQuantidade} onChange={e => setOrcQuantidade(parseInt(e.target.value) || 1)} /></Field>
            <Field label="Prazo de entrega"><Input value={orcPrazo} onChange={e => setOrcPrazo(e.target.value)} placeholder="Ex: 5 dias úteis" /></Field>
          </div>
          <div className="mt-3"><Field label="Validade do orçamento (opcional)"><Input value={orcValidade} onChange={e => setOrcValidade(e.target.value)} placeholder="Ex: 7 dias" /></Field></div>

          <div className="mb-3 mt-5 border-b border-border pb-2.5 font-ui text-sm font-bold uppercase tracking-wide">$ Formas de Pagamento</div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="Forma de pagamento 1"><Input value={orcForma1} onChange={e => setOrcForma1(e.target.value)} placeholder="Ex: Pix" /></Field>
            <Field label="Desconto (opcional)"><Input type="number" step="1" min="0" max="100" value={orcDesconto1} onChange={e => setOrcDesconto1(e.target.value)} placeholder="Ex: 5" /></Field>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="Forma de pagamento 2 (opcional)"><Input value={orcForma2} onChange={e => setOrcForma2(e.target.value)} placeholder="Ex: Cartão 2x" /></Field>
            <Field label="Desconto (opcional)"><Input type="number" step="1" min="0" max="100" value={orcDesconto2} onChange={e => setOrcDesconto2(e.target.value)} placeholder="Ex: 0" /></Field>
          </div>
          <div className="mt-3">
            <Field label="Observações (opcional)"><Textarea rows={3} value={orcObs} onChange={e => setOrcObs(e.target.value)} placeholder="Ex: Acabamento lixado e pintado." /></Field>
          </div>

          <div className="my-4 rounded-lg border border-border bg-white/[0.03] px-3.5 py-3 text-sm leading-relaxed text-muted-foreground">
            Valor do orçamento: <b className="text-foreground">{fmtBRL(result.price)}</b><br />
            {orcForma1 || 'Forma de pagamento 1'}{parseFloat(orcDesconto1) > 0 ? ` (${orcDesconto1}% off)` : ''}: <b className="text-foreground">{fmtBRL(val1)}</b>
            {orcForma2 && <><br />{orcForma2}{parseFloat(orcDesconto2) > 0 ? ` (${orcDesconto2}% off)` : ''}: <b className="text-foreground">{fmtBRL(val2)}</b></>}
          </div>

          <Button className="w-full" onClick={handleExportOrcamento} disabled={orcSubmitting}>📄 Exportar Orçamento em PDF</Button>
          {orcStatus && (
            <div className={`mt-2.5 rounded-lg px-3 py-2.5 text-xs leading-relaxed ${orcStatus.type === 'ok' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
              {orcStatus.text}
            </div>
          )}
          <p className="mt-2.5 text-xs text-muted-foreground">
            Gera o PDF e também salva este orçamento na aba Pedidos com status "Orçamento".
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function SectionTitle({ children }) {
  return <div className="mb-4 border-b border-border pb-2.5 font-ui text-sm font-bold uppercase tracking-wide">{children}</div>
}
function Field({ label, children }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>
}
function Row({ k, v }) {
  return <div className="mb-2 flex justify-between text-[13px]"><span className="text-muted-foreground">{k}</span><span className="font-mono">{v}</span></div>
}
