import type { BlockType } from '../types'

export interface BlockTypeInfo {
  label: string
  /** Blocos fixos (tabelas) não podem ser removidos. */
  removable: boolean
  defaultSize: { w: number; h: number; minW: number; minH: number }
}

/** Registro de tipos de bloco: ponto único para adicionar novos tipos no futuro. */
export const BLOCK_TYPES: Record<BlockType, BlockTypeInfo> = {
  browser: {
    label: 'Navegador',
    removable: true,
    defaultSize: { w: 6, h: 8, minW: 2, minH: 3 },
  },
  fixedTable: {
    label: 'Tabela fixa',
    removable: false,
    defaultSize: { w: 6, h: 8, minW: 2, minH: 3 },
  },
}
