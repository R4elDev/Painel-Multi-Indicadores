import './persistence.css'
import { PanelGrid } from './components/PanelGrid'
import { usePanel } from './hooks/usePanel'
import { usePresentation } from './hooks/usePresentation'

export default function App() {
  const { panel, persistence, replaceStored, addBrowser, removeBlock, updateBrowser, setLayout, setTable } = usePanel()
  const { presenting, enter, exit } = usePresentation()

  const exportJson = (text: string, name: string) => {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
    const link = document.createElement('a'); link.href = url; link.download = name; link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return (
    <div className={`app${presenting ? ' app--presenting' : ''}`}>
      {presenting ? (
        <button type="button" className="exit-presentation" onClick={exit}>
          Sair da apresentação (Esc)
        </button>
      ) : (
        <header className="toolbar">
          <h1>Painel Multi-Indicadores</h1>
          <div className="toolbar-actions">
            <button type="button" className="primary" onClick={addBrowser}>
              + Bloco de navegador
            </button>
            <button type="button" onClick={enter}>
              ▶ Apresentar
            </button>
          </div>
        </header>
      )}
      {!persistence.ok && <aside role="alert" className="persistence-warning">
        <span>{persistence.message}</span>
        <button onClick={() => exportJson(JSON.stringify(panel, null, 2), 'painel.json')}>Exportar painel JSON</button>
        {persistence.original !== undefined && <button onClick={() => exportJson(persistence.original!, 'painel-original.json')}>Exportar original</button>}
        {persistence.blocked && <button onClick={replaceStored}>Substituir original pelo painel atual</button>}
      </aside>}
      <main className="main">
        <PanelGrid
          panel={panel}
          presenting={presenting}
          onLayoutChange={setLayout}
          onRemove={removeBlock}
          onUpdateBrowser={updateBrowser}
          onTableChange={setTable}
        />
      </main>
    </div>
  )
}
