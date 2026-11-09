import type { TableData, TableId } from '../../types'
import EditableTable from './EditableTable/EditableTable'

export interface FixedTableBlockProps {
  tableId: TableId
  data: TableData
  onChange(data: TableData): void
  presenting?: boolean
}

export function FixedTableBlock({ tableId, data, onChange, presenting }: FixedTableBlockProps) {
  return (
    <div style={{ height: '100%', minHeight: 0 }} data-table-id={tableId}>
      <EditableTable data={data} onChange={onChange} readOnly={presenting} />
    </div>
  )
}
