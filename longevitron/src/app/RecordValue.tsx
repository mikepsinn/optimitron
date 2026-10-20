import type { DataRecord, NumericField } from '../lib/schema';

/** The only way to show a sourced number. The page eval checks every one against its record. */
export function RecordValue({ record, field = 'value', decimals = 1 }: { record: DataRecord; field?: NumericField; decimals?: number }) {
  const value = record[field];
  if (value === undefined) return null;
  return (
    <data value={value} data-record={record.id} data-field={field}>
      {value.toFixed(decimals)}
    </data>
  );
}

export function RecordInterval({ record }: { record: DataRecord }) {
  if (record.low === undefined || record.high === undefined) return <span className="muted">none</span>;
  return (
    <>
      <RecordValue record={record} field="low" />–<RecordValue record={record} field="high" />
    </>
  );
}
