import { useCallback, useEffect, useState } from 'react'
import { BLOCK_TYPES } from '../blocks/registry'
import { defaultBrowserConfig, newId } from '../lib/defaults'
import { DEFAULT_PANEL_ID, loadPanel, savePanel, replacePanel } from '../lib/storage'
import type { BrowserConfig, GridItem, PanelState, TableData, TableId } from '../types'

/** Estado do painel + persistência automática em localStorage. */
export function usePanel(panelId: string = DEFAULT_PANEL_ID) {
  const [loaded] = useState(() => loadPanel(panelId))
  const [panel, setPanel] = useState<PanelState>(loaded.panel)
  const [persistence, setPersistence] = useState(loaded.status)

  useEffect(() => {
    if (persistence.blocked) return
    const status = savePanel(panel)
    let active = true
    queueMicrotask(() => {
      if (active) setPersistence(status.ok && loaded.status.message && !loaded.status.blocked ? loaded.status : status)
    })
    return () => { active = false }
  }, [panel, persistence.blocked, loaded.status])

  const addBrowser = useCallback(() => {
    const id = newId()
    const { w, h } = BLOCK_TYPES.browser.defaultSize
    setPanel((p) => {
      const y = p.layout.reduce((max, l) => Math.max(max, l.y + l.h), 0)
      return {
        ...p,
        blocks: [...p.blocks, { id, type: 'browser', config: defaultBrowserConfig() }],
        layout: [...p.layout, { i: id, x: 0, y, w, h }],
      }
    })
  }, [])

  const removeBlock = useCallback((id: string) => {
    setPanel((p) => {
      const block = p.blocks.find((b) => b.id === id)
      if (!block || !BLOCK_TYPES[block.type].removable) return p
      return {
        ...p,
        blocks: p.blocks.filter((b) => b.id !== id),
        layout: p.layout.filter((l) => l.i !== id),
      }
    })
  }, [])

  const updateBrowser = useCallback((id: string, patch: Partial<BrowserConfig>) => {
    setPanel((p) => ({
      ...p,
      blocks: p.blocks.map((b) =>
        b.id === id && b.type === 'browser' ? { ...b, config: { ...b.config, ...patch } } : b,
      ),
    }))
  }, [])

  const setLayout = useCallback((layout: readonly GridItem[]) => {
    const next = layout.map(({ i, x, y, w, h }) => ({ i, x, y, w, h }))
    setPanel((p) => (JSON.stringify(p.layout) === JSON.stringify(next) ? p : { ...p, layout: next }))
  }, [])

  const setTable = useCallback((tableId: TableId, data: TableData) => {
    setPanel((p) => ({ ...p, tables: { ...p.tables, [tableId]: data } }))
  }, [])

  return { panel, persistence, replaceStored: () => {
    const next = replacePanel(panel, persistence)
    setPersistence(next)
  }, addBrowser, removeBlock, updateBrowser, setLayout, setTable }
}
