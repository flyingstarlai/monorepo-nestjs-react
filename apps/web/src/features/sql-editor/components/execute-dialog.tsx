import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Zap, Clock, Database } from 'lucide-react';
import { useExecuteProcedure } from '../hooks/use-sql-editor';
import type { StoredProcedure, ExecutionResult } from '../types';

interface ExecuteProcedureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceSlug: string;
  procedure: StoredProcedure | null;
  onSuccess?: (result: ExecutionResult) => void;
}

interface ProcedureParameter {
  name: string;
  type: string;
  value: string;
  required: boolean;
}

export function ExecuteProcedureDialog({
  open,
  onOpenChange,
  workspaceSlug,
  procedure,
  onSuccess,
}: ExecuteProcedureDialogProps) {
  const [parameters, setParameters] = useState<ProcedureParameter[]>([]);
  const [timeout, setTimeout] = useState(30); // Default 30 seconds
  const [executionResult, setExecutionResult] =
    useState<ExecutionResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const executeMutation = useExecuteProcedure();

  // Parse parameters from procedure SQL (basic implementation)
  const parseParameters = useCallback((sql: string): ProcedureParameter[] => {
    const params: ProcedureParameter[] = [];
    // Simple regex to find parameters - this is a basic implementation
    // In a real implementation, you'd want more sophisticated parsing
    const paramRegex = /@(\w+)/g;
    const matches = sql.match(paramRegex);

    if (matches) {
      const uniqueParams = Array.from(new Set(matches));
      uniqueParams.forEach((param) => {
        const name = param.substring(1); // Remove @
        params.push({
          name,
          type: 'string', // Default type, could be enhanced with type detection
          value: '',
          required: true, // Default to required
        });
      });
    }

    return params;
  }, []);

  // Memoize parsed parameters to prevent re-parsing on every render
  const parsedParameters = useMemo(() => {
    if (!procedure?.sqlPublished) return [];
    return parseParameters(procedure.sqlPublished);
  }, [procedure?.sqlPublished, parseParameters]);

  // Update parameters when procedure changes
  useEffect(() => {
    setParameters(parsedParameters);
    setExecutionResult(null);
  }, [parsedParameters]);

  const handleParameterChange = useCallback(
    (
      index: number,
      field: keyof ProcedureParameter,
      value: string | boolean
    ) => {
      setParameters((prev) =>
        prev.map((param, i) =>
          i === index ? { ...param, [field]: value } : param
        )
      );
    },
    []
  );

  const handleExecute = useCallback(async () => {
    if (!procedure) return;

    // Validate required parameters
    const missingParams = parameters.filter(
      (p) =>
        p.required &&
        (p.value === '' || p.value === null || p.value === undefined)
    );

    if (missingParams.length > 0) {
      return; // Show validation error
    }

    setIsExecuting(true);
    setExecutionResult(null);

    try {
      const parametersObj: Record<string, unknown> = {};
      parameters.forEach((param) => {
        const value = String(param.value).trim();
        if (value) {
          // Convert string values to appropriate types
          if (param.type === 'number') {
            parametersObj[param.name] = Number(value);
          } else if (param.type === 'boolean') {
            parametersObj[param.name] = value.toLowerCase() === 'true';
          } else {
            parametersObj[param.name] = value;
          }
        }
      });

      const result = await executeMutation.mutateAsync({
        workspaceSlug,
        id: procedure.id,
        data: {
          parameters:
            Object.keys(parametersObj).length > 0 ? parametersObj : undefined,
          timeout: timeout * 1000, // Convert to milliseconds
        },
      });

      setExecutionResult(result);
      onSuccess?.(result);
    } catch {
      // Error is handled by the mutation
    } finally {
      setIsExecuting(false);
    }
  }, [
    procedure,
    parameters,
    timeout,
    executeMutation,
    onSuccess,
    workspaceSlug,
  ]);

  const handleClose = useCallback(() => {
    if (!isExecuting) {
      onOpenChange(false);
      setExecutionResult(null);
    }
  }, [isExecuting, onOpenChange]);

  const handleTimeoutChange = useCallback((value: string) => {
    const num = parseInt(value);
    if (!isNaN(num) && num > 0 && num <= 60) {
      setTimeout(num);
    }
  }, []);

  // Memoize missing parameters calculation
  const missingParams = useMemo(
    () => parameters.filter((p) => p.required && !p.value.trim()),
    [parameters]
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Execute Procedure
          </DialogTitle>
          <DialogDescription>
            Execute the stored procedure with custom parameters.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Procedure Info */}
          {procedure && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  {procedure.name}
                </CardTitle>
                <CardDescription>
                  <Badge variant="default">Published</Badge>
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {/* Parameters */}
          {parameters.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Parameters</CardTitle>
                <CardDescription>
                  Configure parameters for the procedure execution.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {parameters.map((param, index) => (
                  <div key={param.name} className="space-y-2">
                    <Label htmlFor={`param-${param.name}`}>
                      {param.name}
                      {param.required && (
                        <span className="text-destructive ml-1">*</span>
                      )}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id={`param-${param.name}`}
                        value={param.value}
                        onChange={(e) =>
                          handleParameterChange(index, 'value', e.target.value)
                        }
                        placeholder={`Enter ${param.name}`}
                        disabled={isExecuting}
                        className="flex-1"
                      />
                      <Select
                        value={param.type}
                        onValueChange={(value) =>
                          handleParameterChange(index, 'type', value)
                        }
                        disabled={isExecuting}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="string">String</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="boolean">Boolean</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}

                {missingParams.length > 0 && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      Please fill in all required parameters:{' '}
                      {missingParams.map((p) => p.name).join(', ')}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-6">
                <div className="text-center text-muted-foreground">
                  <Zap className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <p className="text-sm">This procedure has no parameters.</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    You can execute it directly.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Execution Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Execution Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="timeout">Timeout (seconds)</Label>
                <Input
                  id="timeout"
                  type="number"
                  min="1"
                  max="60"
                  value={timeout}
                  onChange={(e) => handleTimeoutChange(e.target.value)}
                  disabled={isExecuting}
                />
                <p className="text-sm text-muted-foreground">
                  Maximum execution time (1-60 seconds)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Execution Result */}
          {executionResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Execution Result</CardTitle>
              </CardHeader>
              <CardContent>
                {executionResult.success ? (
                  <div className="space-y-3">
                    <Alert>
                      <AlertDescription className="text-green-600">
                        Procedure executed successfully in{' '}
                        {executionResult.executionTime}ms
                        {executionResult.rowCount &&
                          ` - ${executionResult.rowCount} rows affected`}
                      </AlertDescription>
                    </Alert>

                    {executionResult.result && (
                      <div className="space-y-2">
                        <Label>Result:</Label>
                        <pre className="bg-muted p-3 rounded-md text-sm overflow-auto max-h-40">
                          {JSON.stringify(executionResult.result, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <Alert variant="destructive">
                    <AlertDescription>
                      Execution failed:{' '}
                      {executionResult.error || 'Unknown error'}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isExecuting}
          >
            {executionResult ? 'Close' : 'Cancel'}
          </Button>
          {!executionResult && (
            <Button
              onClick={handleExecute}
              disabled={isExecuting || missingParams.length > 0}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Zap className="h-4 w-4 mr-2" />
              {isExecuting ? 'Executing...' : 'Execute Procedure'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
