import { Icon } from '../../components/icons'
import { useEffect, useRef } from 'react'
import type { Crop } from '../../types'

const MIN_ZOOM = 0.1
const MAX_ZOOM = 4

interface CropEditorProps {
  crop: Crop
  viewportWidth: number
  onChange(crop: Crop): void
  onDone(): void
}

const clampZoom = (z: number): number => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z))

/** Camada sobre o iframe: arrastar move o recorte, roda do mouse dá zoom no ponto do cursor. */
export function CropEditor({ crop, viewportWidth, onChange, onDone }: CropEditorProps) {
  const layerRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; y: number } | null>(null)
  const cropRef = useRef(crop)

  useEffect(() => {
    cropRef.current = crop
  }, [crop])

  useEffect(() => {
    const layer = layerRef.current
    if (!layer) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const c = cropRef.current
      const rect = layer.getBoundingClientRect()
      const cx = e.clientX - rect.left
      const cy = e.clientY - rect.top
      const zoom = clampZoom(c.zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1))
      // Mantém o ponto da página sob o cursor fixo.
      onChange({
        ...c,
        zoom,
        x: c.x + cx / c.zoom - cx / zoom,
        y: c.y + cy / c.zoom - cy / zoom,
      })
    }
    layer.addEventListener('wheel', onWheel, { passive: false })
    return () => layer.removeEventListener('wheel', onWheel)
  }, [onChange])

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, y: e.clientY }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return
    const dx = e.clientX - drag.current.x
    const dy = e.clientY - drag.current.y
    drag.current = { x: e.clientX, y: e.clientY }
    const c = cropRef.current
    onChange({ ...c, x: c.x - dx / c.zoom, y: c.y - dy / c.zoom })
  }

  const fitWidth = () => onChange({ ...crop, x: 0, y: 0, zoom: clampZoom(viewportWidth / crop.w) })

  return (
    <>
      <div
        ref={layerRef}
        className="crop-layer"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
      />
      <div className="crop-bar">
        <span>Arraste para mover · roda do mouse = zoom ({Math.round(crop.zoom * 100)}%)</span>
        <button type="button" className="icon-button" aria-label="Ajustar à largura" title="Ajustar à largura" onClick={fitWidth}>
          <Icon name="maximize" />
        </button>
        <button type="button" className="icon-button" aria-label="Restaurar zoom 100%" title="Restaurar zoom 100%" onClick={() => onChange({ ...crop, x: 0, y: 0, zoom: 1 })}>
          <Icon name="refresh" />
        </button>
        <button type="button" className="primary" aria-label="Concluir recorte" title="Concluir recorte" onClick={onDone}>
          <Icon name="check" /> Concluir
        </button>
      </div>
    </>
  )
}
