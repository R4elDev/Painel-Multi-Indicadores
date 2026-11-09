import { useCallback, useEffect, useRef, useState } from 'react'
import { BlockFrame } from '../../components/BlockFrame'
import { GENERIC_EMBED_HINT, embedHint, normalizeRefresh } from '../../lib/embed'
import type { BrowserConfig, Crop } from '../../types'
import { BrowserSettings } from './BrowserSettings'
import { CropEditor } from './CropEditor'

const SLOW_LOAD_MS = 8000

export interface BrowserBlockProps {
  config: BrowserConfig
  presenting: boolean
  onChange(patch: Partial<BrowserConfig>): void
  onRemove(): void
}

export function BrowserBlock({ config, presenting, onChange, onRemove }: BrowserBlockProps) {
  const { url, crop, autoRefreshMin, titulo } = config
  const [reloadKey, setReloadKey] = useState(0)
  const [settingsOpen, setSettingsOpen] = useState(!url)
  const [cropSession, setCropSession] = useState({ active: false, presentation: presenting })
  const cropping = cropSession.active && !presenting && cropSession.presentation === presenting
  const setCropping = (active: boolean) => setCropSession({ active, presentation: presenting })
  if (cropSession.presentation !== presenting) setCropSession({ active: false, presentation: presenting })
  const [hintPreferences, setHintPreferences] = useState<Record<string, boolean>>({})
  const hintOpen = hintPreferences[url] === true
  const hintDismissed = hintPreferences[url] === false
  const [slow, setSlow] = useState(false)
  const slowTimer = useRef<number | undefined>(undefined)
  const viewportRef = useRef<HTMLDivElement>(null)
  const [viewportWidth, setViewportWidth] = useState(0)

  const reload = useCallback(() => {
    setSlow(false)
    setReloadKey((k) => k + 1)
  }, [])

  // Auto-refresh opcional.
  useEffect(() => {
    const minutes = normalizeRefresh(autoRefreshMin)
    if (!url || minutes === 0) return
    const timer = window.setInterval(reload, minutes * 60_000)
    return () => window.clearInterval(timer)
  }, [url, autoRefreshMin, reload])

  // Sem onLoad por um tempo → provável recusa de embed: mostra a dica.
  useEffect(() => {
    if (!url) return
    slowTimer.current = window.setTimeout(() => setSlow(true), SLOW_LOAD_MS)
    return () => window.clearTimeout(slowTimer.current)
  }, [url, reloadKey])

  // Largura do viewport (usada pelo "ajustar à largura").
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const observer = new ResizeObserver(() => setViewportWidth(el.clientWidth))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const setCrop = useCallback((next: Crop) => onChange({ crop: next }), [onChange])

  // URL-based hints stay visible after load, which also fires for blocked frames.
  const knownHint = url ? embedHint(url) : null
  const hint = knownHint ?? (slow || hintOpen ? GENERIC_EMBED_HINT : null)
  const showHint = Boolean(url) && !presenting && !hintDismissed && (Boolean(knownHint) || slow || hintOpen)

  const actions = (
    <>
      <button type="button" title="Recarregar" onClick={reload} disabled={!url}>
        ⟳
      </button>
      <button
        type="button"
        title="Recortar / zoom"
        className={cropping ? 'active' : ''}
        onClick={() => setCropping(!cropping)}
        disabled={!url}
      >
        ✂
      </button>
      <button type="button" title="Dica de embed" onClick={() => setHintPreferences(previous => ({ ...previous, [url]: !showHint }))}>
        ?
      </button>
      <button type="button" title="Configurar" onClick={() => setSettingsOpen(true)}>
        ⚙
      </button>
      <button type="button" title="Remover bloco" className="danger" onClick={onRemove}>
        ✕
      </button>
    </>
  )

  return (
    <BlockFrame title={titulo} presenting={presenting} actions={actions}>
      <div ref={viewportRef} className="browser-viewport">
        {url ? (
          <iframe
            key={`${url}#${reloadKey}`}
            src={url}
            title={titulo}
            className="browser-iframe"
            style={{
              width: crop.w,
              height: crop.h,
              transform: `scale(${crop.zoom}) translate(${-crop.x}px, ${-crop.y}px)`,
            }}
            onLoad={() => { window.clearTimeout(slowTimer.current); setSlow(false) }}
            referrerPolicy="strict-origin-when-cross-origin"
            allow="fullscreen"
          />
        ) : (
          <div className="empty">
            <p>Nenhuma URL configurada.</p>
            <button type="button" onClick={() => setSettingsOpen(true)}>
              Configurar
            </button>
          </div>
        )}

        {cropping && !presenting && url && (
          <CropEditor
            crop={crop}
            viewportWidth={viewportWidth}
            onChange={setCrop}
            onDone={() => setCropping(false)}
          />
        )}

        {showHint && hint && (
          <div className="hint" role="note">
            <span>{hint}</span>
            <button
              type="button"
              aria-label="Fechar dica"
              onClick={() => {
                setHintPreferences(previous => ({ ...previous, [url]: false }))
                setSlow(false)
              }}
            >
              ✕
            </button>
          </div>
        )}

        {settingsOpen && !presenting && (
          <BrowserSettings
            config={config}
            onCancel={() => setSettingsOpen(false)}
            onSave={(patch) => {
              onChange(patch)
              setSettingsOpen(false)
              reload()
            }}
          />
        )}
      </div>
    </BlockFrame>
  )
}
