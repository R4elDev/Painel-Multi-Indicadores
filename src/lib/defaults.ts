import type { BrowserConfig, GridItem, PanelState, TableData, TableId } from '../types'

export const TABLE_IDS: readonly TableId[] = ['tabela1', 'tabela2']

export const TABLE_TITLES: Record<TableId, string> = {
  tabela1: 'Tabela 1',
  tabela2: 'Tabela 2',
}

export function newId(): string {
  return crypto.randomUUID()
}

export function defaultTable(): TableData {
  const colunas = [1, 2, 3].map((n) => ({ id: newId(), nome: `Coluna ${n}` }))
  const linhas = [0, 1, 2].map(() => Object.fromEntries(colunas.map((c) => [c.id, ''])))
  return { colunas, linhas }
}

export function defaultBrowserConfig(): BrowserConfig {
  return {
    titulo: 'Novo indicador',
    url: '',
    crop: { x: 0, y: 0, zoom: 0.5, w: 1280, h: 720 },
    autoRefreshMin: 0,
  }
}

export const tableBlockId = (tableId: TableId): string => `fixed-${tableId}`

export function defaultLayoutFor(tableId: TableId): GridItem {
  return { i: tableBlockId(tableId), x: tableId === 'tabela1' ? 0 : 6, y: 0, w: 6, h: 8 }
}

export function defaultPanel(id: string): PanelState {
  return {
    version: 1,
    id,
    blocks: TABLE_IDS.map((tableId) => ({
      id: tableBlockId(tableId),
      type: 'fixedTable' as const,
      tableId,
    })),
    layout: TABLE_IDS.map(defaultLayoutFor),
    tables: { tabela1: defaultTable(), tabela2: defaultTable() },
  }
}
