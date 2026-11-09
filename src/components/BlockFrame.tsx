import type { ReactNode } from 'react'

interface BlockFrameProps {
  title: string
  presenting: boolean
  actions?: ReactNode
  children: ReactNode
}

/** Moldura comum dos blocos: cabeçalho arrastável (classe .block-header) + corpo. */
export function BlockFrame({ title, presenting, actions, children }: BlockFrameProps) {
  return (
    <section className={`block${presenting ? ' block--presenting' : ''}`}>
      {!presenting && (
        <header className="block-header">
          <span className="block-title" title={title}>
            {title}
          </span>
          <div className="block-actions">{actions}</div>
        </header>
      )}
      <div className="block-body">{children}</div>
    </section>
  )
}
