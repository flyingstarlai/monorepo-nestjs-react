import { FileText, Download, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { StoredProcedure } from '../types';
import { ResultsErrorBoundary } from './results-error-boundary';

interface ResultsPanelProps {
  isExecuting: boolean;
  executionResults: any[];
  executionColumns: Array<{ name: string; type: string }>;
  executionMetadata: {
    executionTime?: number;
    rowCount?: number;
    executedProcedureId?: string;
    consoleMessages?: string[];
    procedureName?: string;
  };
  selectedProcedureId: string;
  executedProcedureId: string | undefined;
  procedures: StoredProcedure[] | undefined;
  exportToCSV: () => void;
  exportToJSON: () => void;
}

export function ResultsPanel({
  isExecuting,
  executionResults,
  executionColumns,
  executionMetadata,
  selectedProcedureId,
  executedProcedureId,
  procedures,
  exportToCSV,
  exportToJSON,
}: ResultsPanelProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ResultsErrorBoundary>
        {isExecuting ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="text-sm">
                Executing procedure
                {executionMetadata.procedureName && ` "${executionMetadata.procedureName}"`}...
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Console Messages Section */}
            {executionMetadata.consoleMessages && executionMetadata.consoleMessages.length > 0 && (
              <div className="border-b border-border/50">
                <div className="flex items-center justify-between p-4 pb-2 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">Console Output</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                      <Database className="h-3 w-3" />
                      {executionMetadata.procedureName || 'Procedure'}
                    </div>
                  </div>
                </div>
                <div className="bg-black text-green-400 font-mono text-xs p-4 overflow-auto max-h-48">
                  {executionMetadata.consoleMessages.map((message, index) => (
                    <div key={index} className="mb-1">
                      {message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {executionResults.length > 0 ? (
              <>
                <div className="flex items-center justify-between p-4 pb-2 flex-shrink-0">
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
                <div
                  className="flex-1 min-h-0 overflow-auto p-4 pt-2 pb-4"
                  tabIndex={0}
                >
                  <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gradient-to-r from-muted/80 to-muted/60 border-b border-border">
                        <tr>
                          {executionColumns.length > 0
                            ? executionColumns.map((column) => (
                                <th
                                  key={column.name}
                                  className="px-4 py-3 text-left font-semibold text-foreground border-r border-border last:border-r-0"
                                >
                                  <div className="flex flex-col gap-1">
                                    <span className="text-sm font-semibold">
                                      {column.name}
                                    </span>
                                    <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md inline-block w-fit">
                                      {column.type}
                                    </span>
                                  </div>
                                </th>
                              ))
                            : Object.keys(executionResults[0] || {}).map((key) => (
                                <th
                                  key={key}
                                  className="px-4 py-3 text-left font-semibold text-foreground border-r border-border last:border-r-0"
                                >
                                  {key}
                                </th>
                              ))}
                        </tr>
                      </thead>
                      <tbody>
                        {executionResults.map((row, index) => (
                          <tr
                            key={index}
                            className="border-b border-border/50 hover:bg-muted/30 transition-colors duration-150 even:bg-muted/10"
                          >
                            {row != null && typeof row === 'object' ? (
                              executionColumns.length > 0 ? (
                                executionColumns.map((column) => (
                                  <td
                                    key={column.name}
                                    className="px-4 py-3 border-r border-border/30 last:border-r-0 align-top"
                                  >
                                    {row[column.name] === null ? (
                                      <span className="text-muted-foreground font-medium bg-muted/40 px-2 py-1 rounded text-xs inline-block">
                                        NULL
                                      </span>
                                    ) : column.type === 'integer' ||
                                      column.type === 'number' ? (
                                      <span className="text-right font-mono font-medium text-blue-600 dark:text-blue-400 block">
                                        {String(row[column.name])}
                                      </span>
                                    ) : column.type === 'boolean' ? (
                                      <span
                                        className={`font-medium px-2 py-1 rounded text-xs inline-block ${
                                          row[column.name] === true
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                        }`}
                                      >
                                        {row[column.name] ? 'TRUE' : 'FALSE'}
                                      </span>
                                    ) : (
                                      <span className="text-foreground">
                                        {String(row[column.name])}
                                      </span>
                                    )}
                                  </td>
                                ))
                              ) : (
                                Object.values(row).map((value, cellIndex) => (
                                  <td
                                    key={cellIndex}
                                    className="px-4 py-3 border-r border-border/30 last:border-r-0 align-top"
                                  >
                                    {value === null ? (
                                      <span className="text-muted-foreground font-medium bg-muted/40 px-2 py-1 rounded text-xs inline-block">
                                        NULL
                                      </span>
                                    ) : (
                                      <span className="text-foreground">
                                        {String(value)}
                                      </span>
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
                                className="px-4 py-3 text-center text-muted-foreground font-medium bg-destructive/10"
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
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center">
                  <Database className="h-12 w-12 text-muted-foreground/30 mb-4 mx-auto" />
                  <h3 className="font-medium text-sm text-muted-foreground mb-2">
                    No Results Yet
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-md mb-4 mx-auto">
                    Execute a stored procedure to see results here. Results will
                    include returned data, execution time, and row counts.
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground justify-center">
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
              </div>
            )}
          </div>
        )}
      </ResultsErrorBoundary>
    </div>
  );
}