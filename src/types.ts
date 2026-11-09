/** Tipos centrais do painel. Independentes de React para facilitar migração futura (Supabase). */

export type TableId = 'tabela1' | 'tabela2'

export interface TableColumn {
  id: string
  nome: string
}

/** Dados de uma tabela fixa. Contrato estável: o bloco FixedTable lê e grava só isto. */
export interface TableData {
  colunas: TableColumn[]
  linhas: Record<string, string>[]
}

/** Recorte: posição (px da página embutida) e zoom aplicados ao iframe. */
export interface Crop {
  /** Tamanho virtual (px) do iframe; o recorte desloca/escala esse retângulo. */
  w: number
  h: number
  x: number
  y: number
  zoom: number
}

export interface BrowserConfig {
  titulo: string
  url: string
  crop: Crop
  /** Intervalo de auto-refresh em minutos; 0 = desligado. */
  autoRefreshMin: number
}

export interface BrowserBlockModel {
  id: string
  type: 'browser'
  config: BrowserConfig
}

export interface FixedTableBlockModel {
  id: string
  type: 'fixedTable'
  tableId: TableId
}

export type BlockModel = BrowserBlockModel | FixedTableBlockModel
export type BlockType = BlockModel['type']

export interface GridItem {
  i: string
  x: number
  y: number
  w: number
  h: number
}

/** Estado completo de um painel. `id` permite vários painéis no futuro. */
export interface PanelState {
  version: 1
  id: string
  blocks: BlockModel[]
  layout: GridItem[]
  tables: Record<TableId, TableData>
}
