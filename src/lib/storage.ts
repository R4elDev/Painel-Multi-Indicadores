import type { BlockModel, GridItem, PanelState, TableData } from '../types'
import { TABLE_IDS, defaultLayoutFor, defaultPanel, defaultTable, tableBlockId } from './defaults'
import { normalizeRefresh, normalizeUrl } from './embed'

const keyFor = (id: string) => `painel:v1:${id}`
export const DEFAULT_PANEL_ID = 'default'
export interface PersistenceStatus { ok: boolean; message?: string; blocked?: boolean; original?: string }
export interface LoadedPanel { panel: PanelState; status: PersistenceStatus }
const object = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const positive = (v: unknown): v is number => finite(v) && v > 0
const id = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0

function table(value: unknown, issues: string[]): TableData {
  if (!object(value)) { issues.push('Tabela ausente ou invalida: restaurada.'); return defaultTable() }
  if (!Array.isArray(value.colunas)) issues.push('Lista de colunas invalida: restaurada.')
  if (!Array.isArray(value.linhas)) issues.push('Lista de linhas invalida: restaurada.')
  const seen = new Set<string>()
  const colunas: TableData['colunas'] = []
  if (Array.isArray(value.colunas)) for (const c of value.colunas) {
    if (!object(c) || !id(c.id) || typeof c.nome !== 'string' || seen.has(c.id)) { issues.push('Coluna invalida ou duplicada descartada.'); continue }
    seen.add(c.id)
    colunas.push({ id: c.id, nome: c.nome })
  }
  const linhas: TableData['linhas'] = []
  if (Array.isArray(value.linhas)) for (const row of value.linhas) {
    if (!object(row)) { issues.push('Linha invalida descartada.'); continue }
    if (Object.keys(row).some(key => !seen.has(key)) || colunas.some(c => typeof row[c.id] !== 'string')) issues.push('Celulas invalidas, ausentes ou sem coluna foram recuperadas.')
    linhas.push(Object.fromEntries(colunas.map(c => [c.id, typeof row[c.id] === 'string' ? String(row[c.id]) : ''])))
  }
  return { colunas, linhas }
}

export function sanitize(raw: unknown, panelId: string, issues: string[] = []): PanelState {
  if (!object(raw) || raw.version !== 1 || !Array.isArray(raw.blocks) || !Array.isArray(raw.layout)) throw new Error('Formato ou versão de painel incompatível.')
  const blocks: BlockModel[] = []
  const ids = new Set<string>()
  const tablesSeen = new Set<string>()
  for (const b of raw.blocks) {
    if (!object(b) || !id(b.id) || ids.has(b.id)) { issues.push('Bloco invalido ou ID duplicado descartado.'); continue }
    if (b.type === 'fixedTable' && (b.tableId === 'tabela1' || b.tableId === 'tabela2') && !tablesSeen.has(b.tableId)) {
      blocks.push({ id: b.id, type: 'fixedTable', tableId: b.tableId }); tablesSeen.add(b.tableId)
    } else if (b.type === 'browser' && object(b.config)) {
      const c = b.config, r = c.crop
      if (typeof c.titulo !== 'string' || typeof c.url !== 'string' || !finite(c.autoRefreshMin) || !object(r) || !finite(r.x) || !finite(r.y) || !positive(r.w) || !positive(r.h) || !positive(r.zoom)) { issues.push(`Configuracao invalida no bloco ${b.id}: descartado.`); continue }
      if (normalizeRefresh(c.autoRefreshMin) !== c.autoRefreshMin) issues.push(`Auto-refresh do bloco ${b.id} ajustado para o intervalo permitido.`)
      try {
        blocks.push({ id: b.id, type: 'browser', config: { titulo: c.titulo, url: normalizeUrl(c.url), autoRefreshMin: normalizeRefresh(c.autoRefreshMin), crop: { x: r.x, y: r.y, w: r.w, h: r.h, zoom: r.zoom } } })
      } catch { issues.push(`URL inválida no bloco ${b.id}: use somente HTTP(S). O bloco foi descartado.`); continue }
    } else { issues.push(`Tipo, config ou tableId invalido/duplicado no bloco ${b.id}: descartado.`); continue }
    ids.add(b.id)
  }
  for (const tableId of TABLE_IDS) if (!tablesSeen.has(tableId)) {
    issues.push(`Bloco fixo ${tableId} ausente: restaurado.`)
    let blockId = tableBlockId(tableId)
    while (ids.has(blockId)) blockId += '-restored'
    ids.add(blockId); blocks.push({ id: blockId, type: 'fixedTable', tableId })
  }
  const layout: GridItem[] = []
  const placed = new Set<string>()
  for (const l of raw.layout) {
    if (!object(l) || !id(l.i) || !ids.has(l.i) || placed.has(l.i) || !finite(l.x) || l.x < 0 || !finite(l.y) || l.y < 0 || !positive(l.w) || !positive(l.h)) { issues.push('Item de layout invalido, duplicado ou sem bloco descartado.'); continue }
    layout.push({ i: l.i, x: l.x, y: l.y, w: l.w, h: l.h }); placed.add(l.i)
  }
  for (const b of blocks) if (!placed.has(b.id)) {
    issues.push(`Layout do bloco ${b.id} ausente: restaurado.`)
    layout.push({ ...defaultLayoutFor(b.type === 'fixedTable' ? b.tableId : 'tabela1'), i: b.id, y: layout.reduce((m, l) => Math.max(m, l.y + l.h), 0) })
  }
  const t = object(raw.tables) ? raw.tables : {}
  return { version: 1, id: panelId, blocks, layout, tables: { tabela1: table(t.tabela1, issues), tabela2: table(t.tabela2, issues) } }
}
function preserveOriginal(panelId: string, original: string, message: string): PersistenceStatus {
  let backup: string
  try {
    const key = `${keyFor(panelId)}:backup:${Date.now()}:${crypto.randomUUID()}`
    localStorage.setItem(key, original)
    backup = ` Copia preservada em ${key}.`
  } catch { backup = ' Nao foi possivel gravar o backup; exporte o original abaixo.' }
  return { ok: false, blocked: true, original, message: message + ' O original nao sera sobrescrito sem acao explicita.' + backup }
}
export function loadPanel(panelId = DEFAULT_PANEL_ID): LoadedPanel {
  let original: string | null
  try { original = localStorage.getItem(keyFor(panelId)) }
  catch { return { panel: defaultPanel(panelId), status: { ok: false, message: 'Armazenamento indisponivel. As alteracoes ficam apenas nesta sessao.' } } }
  if (original === null) return { panel: defaultPanel(panelId), status: { ok: true } }
  try {
    const issues: string[] = []
    const panel = sanitize(JSON.parse(original), panelId, issues)
    return { panel, status: issues.length ? preserveOriginal(panelId, original, issues.join(' ')) : { ok: true } }
  } catch {
    return { panel: defaultPanel(panelId), status: preserveOriginal(panelId, original, 'JSON invalido ou versao desconhecida.') }
  }
}
/** Uma tentativa explicita so libera o bloqueio depois de gravar com sucesso. */
export function replacePanel(state: PanelState, previous: PersistenceStatus): PersistenceStatus {
  const result = savePanel(state)
  return result.ok ? result : { ...previous, ok: false, message: [previous.message, result.message].filter(Boolean).join(' ') }
}
export function savePanel(state: PanelState): PersistenceStatus {
  try { localStorage.setItem(keyFor(state.id), JSON.stringify(state)); return { ok: true } }
  catch { return { ok: false, message: 'Não foi possível salvar (cota excedida ou armazenamento indisponível). Exporte o JSON para preservar as alterações.' } }
}
