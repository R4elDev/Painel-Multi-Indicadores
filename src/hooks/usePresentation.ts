import { useCallback, useEffect, useState } from 'react'

/** Modo apresentação: esconde controles e entra em tela cheia. Esc sai de ambos. */
export function usePresentation() {
  const [presenting, setPresenting] = useState(false)

  const enter = useCallback(() => {
    setPresenting(true)
    document.documentElement.requestFullscreen?.().catch(() => {
      // Tela cheia negada: o modo apresentação continua sem ela.
    })
  }, [])

  const exit = useCallback(() => {
    setPresenting(false)
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {})
  }, [])

  useEffect(() => {
    const onChange = () => {
      if (!document.fullscreenElement) setPresenting(false)
    }
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') exit() }
    document.addEventListener('keydown', onKey)
    document.addEventListener('fullscreenchange', onChange)
    return () => { document.removeEventListener('fullscreenchange', onChange); document.removeEventListener('keydown', onKey) }
  }, [exit])

  return { presenting, enter, exit }
}
