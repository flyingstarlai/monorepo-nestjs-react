export interface ExecutionMetadata {
  executionTime?: number;
  rowCount?: number;
}

export const exportToCSV = (
  executionResults: Record<string, unknown>[],
  executionColumns: Array<{ name: string; type: string }>
) => {
  if (executionResults.length === 0) return;

  const headers =
    executionColumns.length > 0
      ? executionColumns.map((col) => col.name)
      : Object.keys(executionResults[0] || {});

  const csvContent = [
    headers.join(','),
    ...executionResults.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          // Escape quotes and wrap in quotes if contains comma or quote
          return stringValue.includes(',') || stringValue.includes('"')
            ? `"${stringValue.replace(/"/g, '""')}"`
            : stringValue;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `query_results_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`
  );
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToJSON = (
  executionResults: Record<string, unknown>[],
  executionColumns: Array<{ name: string; type: string }>,
  executionMetadata: ExecutionMetadata
) => {
  if (executionResults.length === 0) return;

  const jsonContent = JSON.stringify(
    {
      data: executionResults,
      columns: executionColumns,
      metadata: executionMetadata,
      exportedAt: new Date().toISOString(),
    },
    null,
    2
  );

  const blob = new Blob([jsonContent], {
    type: 'application/json;charset=utf-8;',
  });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `query_results_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`
  );
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
