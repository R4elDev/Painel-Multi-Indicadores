import { useState } from 'react'
import ReactGridLayout, { useContainerWidth, verticalCompactor } from 'react-grid-layout'
import { BrowserBlock } from '../blocks/BrowserBlock/BrowserBlock'
import { FixedTableBlock } from '../blocks/FixedTable/FixedTableBlock'
import { BLOCK_TYPES } from '../blocks/registry'
import { TABLE_TITLES } from '../lib/defaults'
import type { BlockModel, BrowserConfig, GridItem, PanelState, TableData, TableId } from '../types'
import { BlockFrame } from './BlockFrame'

const GRID_CONFIG = { cols: 12, rowHeight: 40, margin: [8, 8] as const, containerPadding: [8, 8] as const }

interface PanelGridProps {
  panel: PanelState
  presenting: boolean
  onLayoutChange(layout: readonly GridItem[]): void
  onRemove(id: string): void
  onUpdateBrowser(id: string, patch: Partial<BrowserConfig>): void
  onTableChange(tableId: TableId, data: TableData): void
}

export function PanelGrid({
  panel,
  presenting,
  onLayoutChange,
  onRemove,
  onUpdateBrowser,
  onTableChange,
}: PanelGridProps) {
  const { width, containerRef, mounted } = useContainerWidth()
  // Durante arrastar/redimensionar, iframes não podem capturar o mouse.
  const [interacting, setInteracting] = useState(false)
  const start = () => setInteracting(true)
  const stop = () => setInteracting(false)

  const renderBlock = (block: BlockModel) => {
    if (block.type === 'browser') {
      return (
        <BrowserBlock
          config={block.config}
          presenting={presenting}
          onChange={(patch) => onUpdateBrowser(block.id, patch)}
          onRemove={() => onRemove(block.id)}
        />
      )
    }
    return (
      <BlockFrame title={TABLE_TITLES[block.tableId]} presenting={presenting}>
        <FixedTableBlock
          presenting={presenting}
          tableId={block.tableId}
          data={panel.tables[block.tableId]}
          onChange={(data) => onTableChange(block.tableId, data)}
        />
      </BlockFrame>
    )
  }

  const layout = panel.layout.map((item) => {
    const block = panel.blocks.find((b) => b.id === item.i)
    const size = block ? BLOCK_TYPES[block.type].defaultSize : undefined
    return { ...item, minW: size?.minW, minH: size?.minH }
  })

  return (
    <div ref={containerRef} className={`grid${interacting ? ' grid--interacting' : ''}`}>
      {mounted && (
        <ReactGridLayout
          width={width}
          layout={layout}
          gridConfig={GRID_CONFIG}
          dragConfig={{ enabled: !presenting, handle: '.block-header', cancel: '.block-actions' }}
          resizeConfig={{ enabled: !presenting }}
          compactor={verticalCompactor}
          onLayoutChange={onLayoutChange}
          onDragStart={start}
          onDragStop={stop}
          onResizeStart={start}
          onResizeStop={stop}
        >
          {panel.blocks.map((block) => (
            <div key={block.id}>{renderBlock(block)}</div>
          ))}
        </ReactGridLayout>
      )}
    </div>
  )
}
