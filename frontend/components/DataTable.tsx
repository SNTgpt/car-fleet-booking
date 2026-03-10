'use client';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
}

interface Props<T> {
  columns: Column<T>[];
  data: T[];
  keyField?: string;
}

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyField = 'id',
}: Props<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            {columns.map((col) => (
              <th key={col.key} className="text-left py-3 px-4 font-semibold text-gray-600">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-8 text-gray-400">
                Nessun dato disponibile
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr key={item[keyField]} className="border-b border-gray-100 hover:bg-gray-50">
                {columns.map((col) => (
                  <td key={col.key} className="py-3 px-4">
                    {col.render ? col.render(item) : item[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
