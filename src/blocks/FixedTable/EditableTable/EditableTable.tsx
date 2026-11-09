import { Icon } from '../../../components/icons'
import { useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { TableData } from '../../../types';
import './EditableTable.css';

export type EditableTableProps = {
  data: TableData;
  /** O pai deve repassar em data o MESMO objeto recebido em onChange.
   * Clonar o wrapper conta como substitui??o externa e cancela a edi??o em curso.
   */
  onChange(data: TableData): void;
  readOnly?: boolean;
};
type Draft = { row: string | null; column: string; value: string };
type FocusIntent = { kind: 'cell' | 'input'; row: string; column: string } | { kind: 'rename'; column: string } | { kind: 'addRow' | 'addColumn' };

export default function EditableTable({ data, onChange, readOnly = false }: EditableTableProps) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const pending = useRef<Draft | null>(null);
  const lastEmittedRef = useRef<TableData | null>(null);
  const observedData = useRef(data);
  const observedReadOnly = useRef(readOnly);
  const [rowKeys, setRowKeys] = useState(() => data.linhas.map(() => crypto.randomUUID() as string));
  const rowIds = useRef(rowKeys);
  const cells = useRef(new Map<string, HTMLTableCellElement>());
  const renameButtons = useRef(new Map<string, HTMLButtonElement>());
  const addRowButton = useRef<HTMLButtonElement | null>(null);
  const addColumnButton = useRef<HTMLButtonElement | null>(null);
  const editor = useRef<HTMLInputElement | null>(null);
  const focusIntent = useRef<FocusIntent | null>(null);

  // Reconcile before paint, ahead of focus. Own emissions preserve edits;
  // external replacements receive fresh internal row identities.
  useLayoutEffect(() => {
    const external = observedData.current !== data && data !== lastEmittedRef.current;
    // Each emission can be acknowledged only once. A later restoration of
    // that same object must be treated as an external replacement.
    if (observedData.current !== data) lastEmittedRef.current = null;
    observedData.current = data;
    if (external) {
      rowIds.current = data.linhas.map(() => crypto.randomUUID());
      setRowKeys(rowIds.current);
    }
    if (external || observedReadOnly.current !== readOnly) {
      pending.current = null;
      focusIntent.current = null;
      setDraft(null);
    }
    observedReadOnly.current = readOnly;
  }, [data, readOnly]);

  const cellKey = (row: string, column: string) => JSON.stringify([row, column]);
  useLayoutEffect(() => {
    const intent = focusIntent.current;
    if (!intent || readOnly) return;
    const target = intent.kind === 'addRow' ? addRowButton.current
      : intent.kind === 'addColumn' ? addColumnButton.current
      : intent.kind === 'rename' ? renameButtons.current.get(intent.column)
      : intent.kind === 'input' ? editor.current
      : intent.kind === 'cell' ? cells.current.get(cellKey(intent.row, intent.column)) : null;
    if (target) {
      focusIntent.current = null;
      target.focus();
    }
  });
  const active = readOnly ? null : draft;
  function edit(value: Draft | null) { pending.current = value; setDraft(value); }
  function emit(next: TableData) {
    lastEmittedRef.current = next;
    onChange(next);
  }
  function commit() {
    const value = pending.current;
    edit(null);
    if (!value || readOnly || !data.colunas.some(c => c.id === value.column)) return;
    if (value.row === null) {
      if (data.colunas.find(c => c.id === value.column)?.nome === value.value) return;
      emit({ ...data, colunas: data.colunas.map(c => c.id === value.column ? { ...c, nome: value.value } : c) });
    } else {
      const index = rowIds.current.indexOf(value.row);
      if (index < 0 || (data.linhas[index][value.column] ?? '') === value.value) return;
      emit({ ...data, linhas: data.linhas.map((r, i) => i === index ? { ...r, [value.column]: value.value } : r) });
    }
  }
  function keys(e: KeyboardEvent<HTMLInputElement>) {
    if (!active) return;
    const value = active;
    if (e.key === 'Escape' || e.key === 'Enter') {
      e.preventDefault();
      focusIntent.current = value.row === null ? { kind: 'rename', column: value.column }
        : { kind: 'cell', row: value.row, column: value.column };
      if (e.key === 'Escape') edit(null); else commit();
    } else if (e.key === 'Tab' && value.row !== null) {
      const index = rowIds.current.indexOf(value.row) * data.colunas.length + data.colunas.findIndex(c => c.id === value.column) + (e.shiftKey ? -1 : 1);
      commit();
      if (index >= 0 && index < data.linhas.length * data.colunas.length) {
        e.preventDefault();
        const row = Math.floor(index / data.colunas.length);
        const column = data.colunas[index % data.colunas.length].id;
        const rowId = rowIds.current[row];
        focusIntent.current = { kind: 'input', row: rowId, column };
        edit({ row: rowId, column, value: data.linhas[row][column] ?? '' });
      }
    }
  }
  function input(label: string) {
    return <input ref={editor} autoFocus aria-label={label} value={active?.value ?? ''}
      onFocus={e => e.currentTarget.select()} onBlur={() => {
        // An old input can blur as Tab replaces it with the next editor.
        if (pending.current?.row === active?.row && pending.current?.column === active?.column) commit();
      }} onKeyDown={keys}
      onChange={e => { if (active) edit({ ...active, value: e.target.value }); }} />;
  }
  return <section className="editable-table" aria-label="Tabela editável">
    {!readOnly && <div className="editable-table__toolbar">
      <button ref={addRowButton} type="button" aria-label="Adicionar linha" title="Adicionar linha" disabled={!data.colunas.length} onClick={() => {
        const row: Record<string, string> = {};
        data.colunas.forEach(c => { row[c.id] = ''; });
        const rowId = crypto.randomUUID();
        rowIds.current = [...rowIds.current, rowId];
        setRowKeys(rowIds.current);
        focusIntent.current = { kind: 'cell', row: rowId, column: data.colunas[0].id };
        emit({ ...data, linhas: [...data.linhas, row] });
      }}><Icon name="plus" />Adicionar linha</button>
      <button ref={addColumnButton} type="button" aria-label="Adicionar coluna" title="Adicionar coluna" onClick={() => {
        const id = crypto.randomUUID();
        focusIntent.current = { kind: 'rename', column: id };
        emit({ colunas: [...data.colunas, { id, nome: 'Nova coluna' }],
          linhas: data.linhas.map(r => ({ ...r, [id]: '' })) });
      }}><Icon name="plus" />Adicionar coluna</button>
    </div>}
    <div className="editable-table__scroll">
      {!data.colunas.length ? <div className="editable-table__empty"><strong>Sua tabela começa aqui</strong>
        <p>{readOnly ? 'Ainda não há colunas.' : 'Adicione uma coluna para começar.'}</p></div>
        : <table><thead><tr>{data.colunas.map(c => <th key={c.id} scope="col">
          <div className="editable-table__heading">
            {active?.row === null && active.column === c.id ? input('Nome da coluna')
              : readOnly ? <span>{c.nome}</span>
              : <button type="button" title="Renomear coluna" aria-label={'Renomear coluna ' + c.nome}
                ref={el => { if (el) renameButtons.current.set(c.id, el); else renameButtons.current.delete(c.id); }}
                onClick={() => edit({ row: null, column: c.id, value: c.nome })}>{c.nome || 'Sem nome'}</button>}
            {!readOnly && <button type="button" title={'Remover coluna ' + c.nome} aria-label={'Remover coluna ' + c.nome} onClick={() => {
              edit(null);
              const index = data.colunas.findIndex(col => col.id === c.id);
              const neighbor = data.colunas[index + 1] ?? data.colunas[index - 1];
              focusIntent.current = neighbor ? { kind: 'rename', column: neighbor.id } : { kind: 'addColumn' };
              emit({ colunas: data.colunas.filter(col => col.id !== c.id),
                linhas: data.linhas.map(r => { const next = { ...r }; delete next[c.id]; return next; }) });
            }}><Icon name="x" /></button>}
          </div></th>)}
          {!readOnly && <th scope="col">Ações</th>}
        </tr></thead><tbody>{data.linhas.map((r, i) => <tr key={rowKeys[i]}>
          {data.colunas.map(c => <td key={c.id} tabIndex={readOnly ? undefined : 0}
            ref={el => { const k = cellKey(rowKeys[i], c.id); if (el) cells.current.set(k, el); else cells.current.delete(k); }}
            aria-label={c.nome + ', linha ' + (i + 1)}
            onClick={() => { if (!readOnly && !(active?.row === rowKeys[i] && active.column === c.id)) edit({ row: rowKeys[i], column: c.id, value: r[c.id] ?? '' }); }}
            onKeyDown={e => {
              if (!readOnly && e.target === e.currentTarget && e.key === 'Enter') {
                e.preventDefault(); edit({ row: rowKeys[i], column: c.id, value: r[c.id] ?? '' });
              }
            }}>
            {active?.row === rowKeys[i] && active.column === c.id ? input(c.nome + ', linha ' + (i + 1))
              : <span className="editable-table__value">{r[c.id] || '\u00a0'}</span>}
          </td>)}
          {!readOnly && <td><button type="button" title={'Remover linha ' + (i + 1)} aria-label={'Remover linha ' + (i + 1)} onClick={() => {
            edit(null);
            const neighbor = rowIds.current[i + 1] ?? rowIds.current[i - 1];
            focusIntent.current = neighbor
              ? { kind: 'cell', row: neighbor, column: data.colunas[0].id }
              : { kind: 'addRow' };
            rowIds.current = rowIds.current.filter((_, index) => index !== i);
            setRowKeys(rowIds.current);
            emit({ ...data, linhas: data.linhas.filter((_, n) => n !== i) });
          }}><Icon name="trash" /></button></td>}
        </tr>)}</tbody></table>}
      {!!data.colunas.length && !data.linhas.length && <div className="editable-table__empty">
        <strong>Nenhuma linha ainda</strong><p>{readOnly ? 'Ainda não há dados.' : 'Use “Adicionar linha” para inserir dados.'}</p>
      </div>}
    </div>
  </section>;
}
