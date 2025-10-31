import { Button } from '@/components/ui/button';
import { Database, FileText, Download } from 'lucide-react';
import type { StoredProcedure } from '../types';
import { ResultsErrorBoundary } from './results-error-boundary';

interface ResultsPanelProps {
  isExecuting: boolean;
  executionResults: Record<string, unknown>[];
  executionColumns: Array<{ name: string; type: string }>;
  executionMetadata: {
    executionTime?: number;
    rowCount?: number;
  };
  executedProcedureId: string | null;
  selectedProcedureId: string | null;
  procedures: StoredProcedure[] | undefined;
  exportToCSV: () => void;
  exportToJSON: () => void;
}

export function ResultsPanel({
  isExecuting,
  executionResults,
  executionColumns,
  executionMetadata,
  executedProcedureId,
  selectedProcedureId,
  procedures,
  exportToCSV,
  exportToJSON,
}: ResultsPanelProps) {
  return (
    <div className="flex flex-col h-full p-4">
      <ResultsErrorBoundary>
        {isExecuting ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="text-sm">Executing procedure...</span>
            </div>
          </div>
        ) : executionResults.length > 0 ? (
          <div className="flex flex-col h-full min-h-0">
            <div className="flex items-center justify-between mb-2 flex-shrink-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">Results</p>
                {executedProcedureId &&
                  executedProcedureId !== selectedProcedureId && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                      <Database className="h-3 w-3" />
                      From:{' '}
                      {procedures?.find((p) => p.id === executedProcedureId)
                        ?.name || 'Unknown'}
                    </div>
                  )}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportToCSV}
                    className="h-7 px-2 text-xs"
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportToJSON}
                    className="h-7 px-2 text-xs"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    JSON
                  </Button>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {executionMetadata.rowCount !== undefined && (
                    <span>
                      {executionMetadata.rowCount} row
                      {executionMetadata.rowCount !== 1 ? 's' : ''}
                    </span>
                  )}
                  {executionMetadata.executionTime && (
                    <span>{executionMetadata.executionTime}ms</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-auto border rounded-md">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    {executionColumns.length > 0
                      ? executionColumns.map((column) => (
                          <th
                            key={column.name}
                            className="px-3 py-2 text-left font-medium border-b"
                          >
                            <div className="flex items-center gap-2">
                              {column.name}
                              <span className="text-xs text-muted-foreground font-normal">
                                ({column.type})
                              </span>
                            </div>
                          </th>
                        ))
                      : Object.keys(executionResults[0] || {}).map((key) => (
                          <th
                            key={key}
                            className="px-3 py-2 text-left font-medium border-b"
                          >
                            {key}
                          </th>
                        ))}
                  </tr>
                </thead>
                <tbody>
                  {executionResults.map((row, index) => (
                    <tr key={index} className="border-b">
                      {row != null && typeof row === 'object' ? (
                        executionColumns.length > 0 ? (
                          executionColumns.map((column) => (
                            <td key={column.name} className="px-3 py-2">
                              {row[column.name] === null ? (
                                <span className="text-muted-foreground italic">
                                  NULL
                                </span>
                              ) : column.type === 'integer' ||
                                column.type === 'number' ? (
                                <span className="text-right font-mono">
                                  {String(row[column.name])}
                                </span>
                              ) : (
                                String(row[column.name])
                              )}
                            </td>
                          ))
                        ) : (
                          Object.values(row).map((value, cellIndex) => (
                            <td key={cellIndex} className="px-3 py-2">
                              {value === null ? (
                                <span className="text-muted-foreground italic">
                                  NULL
                                </span>
                              ) : (
                                String(value)
                              )}
                            </td>
                          ))
                        )
                      ) : (
                        <td
                          colSpan={
                            executionColumns.length ||
                            Object.keys(executionResults[0] || {}).length
                          }
                          className="px-3 py-2 text-center text-muted-foreground italic"
                        >
                          Invalid row data
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Database className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="font-medium text-sm text-muted-foreground mb-2">
              No Results Yet
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mb-4">
              Execute a stored procedure to see results here. Results will
              include returned data, execution time, and row counts.
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Execution info</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Query results</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>Performance metrics</span>
              </div>
            </div>
          </div>
        )}
      </ResultsErrorBoundary>
    </div>
  );
}
