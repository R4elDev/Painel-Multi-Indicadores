import { Icon } from '../../components/icons'
import { useState } from 'react'
import { normalizeUrl, normalizeRefresh, embedHint, GENERIC_EMBED_HINT } from '../../lib/embed'
import type { BrowserConfig } from '../../types'

interface BrowserSettingsProps {
  config: BrowserConfig
  onSave(patch: Partial<BrowserConfig>): void
  onCancel(): void
}

const num = (value: string, fallback: number): number => {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

/** Formulário de configuração do bloco; só grava ao clicar em Salvar (evita recarregar a cada tecla). */
export function BrowserSettings({ config, onSave, onCancel }: BrowserSettingsProps) {
  const [error, setError] = useState('')
  const [titulo, setTitulo] = useState(config.titulo)
  const [url, setUrl] = useState(config.url)
  const [refresh, setRefresh] = useState(String(config.autoRefreshMin))
  const [x, setX] = useState(String(config.crop.x))
  const [y, setY] = useState(String(config.crop.y))
  const [zoom, setZoom] = useState(String(config.crop.zoom * 100))
  const [w, setW] = useState(String(config.crop.w))
  const [h, setH] = useState(String(config.crop.h))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    let normalized: string
    try { normalized = normalizeUrl(url) }
    catch { setError('Use uma URL http:// ou https:// válida.'); return }
    setError('')
    onSave({
      titulo: titulo.trim() || 'Sem título',
      url: normalized,
      autoRefreshMin: normalizeRefresh(num(refresh, 0)),
      crop: {
        x: num(x, 0),
        y: num(y, 0),
        zoom: Math.min(400, Math.max(10, num(zoom, 100))) / 100,
        w: Math.max(200, num(w, 1280)),
        h: Math.max(200, num(h, 720)),
      },
    })
  }

  return (
    <form className="settings" onSubmit={submit}>
      <label>
        Título
        <input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
      </label>
      <label>
        URL (preferir link de embed)
        <input
          value={url}
          placeholder="https://..."
          onChange={(e) => setUrl(e.target.value)}
          autoFocus
        />
      </label>
      {error && <p role="alert" className="form-hint"><Icon name="alert" />{error}</p>}
      {url.trim() && <p role="note" className="form-hint">{(() => { try { return embedHint(normalizeUrl(url)) ?? GENERIC_EMBED_HINT } catch { return 'Use uma URL http:// ou https:// válida.' } })()}</p>}
      <label>
        Auto-refresh (minutos, 0 = desligado)
        <input type="number" min={0} max={1440} step="any" value={refresh} onChange={(e) => setRefresh(e.target.value)} />
      </label>
      <fieldset>
        <legend>Recorte</legend>
        <label>
          X
          <input type="number" step="any" value={x} onChange={(e) => setX(e.target.value)} />
        </label>
        <label>
          Y
          <input type="number" step="any" value={y} onChange={(e) => setY(e.target.value)} />
        </label>
        <label>
          Zoom %
          <input type="number" step="any" value={zoom} onChange={(e) => setZoom(e.target.value)} />
        </label>
        <label>
          Largura da página
          <input type="number" step="any" value={w} onChange={(e) => setW(e.target.value)} />
        </label>
        <label>
          Altura da página
          <input type="number" step="any" value={h} onChange={(e) => setH(e.target.value)} />
        </label>
      </fieldset>
      <div className="settings-buttons">
        <button type="button" className="icon-button" aria-label="Cancelar" title="Cancelar" onClick={onCancel}>
          <Icon name="x" />
        </button>
        <button type="submit" className="primary" aria-label="Salvar configuração" title="Salvar configuração">
          <Icon name="check" /> Salvar
        </button>
      </div>
    </form>
  )
}
