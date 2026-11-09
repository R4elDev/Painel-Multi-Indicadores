import { Icon } from './components/icons'
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
        <button type="button" className="exit-presentation icon-button" aria-label="Sair da apresentação (Esc)" title="Sair da apresentação (Esc)" onClick={exit}>
          <Icon name="minimize" />
        </button>
      ) : (
        <header className="toolbar">
          <h1>Painel Multi-Indicadores</h1>
          <div className="toolbar-actions">
            <button type="button" className="primary" aria-label="Adicionar bloco" title="Adicionar bloco de navegador" onClick={addBrowser}>
              <Icon name="plus" /> Adicionar bloco
            </button>
            <button type="button" className="icon-button" aria-label="Apresentar" title="Apresentar" onClick={enter}>
              <Icon name="maximize" />
            </button>
          </div>
        </header>
      )}
      {!persistence.ok && <aside role="alert" className="persistence-warning">
        <Icon name="alert" /><span>{persistence.message}</span>
        <button className="icon-button" aria-label="Exportar painel JSON" title="Exportar painel JSON" onClick={() => exportJson(JSON.stringify(panel, null, 2), 'painel.json')}><Icon name="download" /></button>
        {persistence.original !== undefined && <button className="icon-button" aria-label="Exportar original" title="Exportar original" onClick={() => exportJson(persistence.original!, 'painel-original.json')}><Icon name="download" /></button>}
        {persistence.blocked && <button className="icon-button" aria-label="Substituir original pelo painel atual" title="Substituir original pelo painel atual" onClick={replaceStored}><Icon name="check" /></button>}
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
