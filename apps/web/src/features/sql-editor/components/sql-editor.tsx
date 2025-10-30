import { useRef, useEffect, useState, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  Rocket,
  Save,
  Edit,
  Play,
} from 'lucide-react';
import { useValidateSql } from '../hooks/use-sql-editor';
import { useSqlEditorStore } from '../stores/sql-editor.store';
import type { StoredProcedure, ValidationIssue } from '../types';

interface SqlEditorComponentProps {
  procedure: StoredProcedure | null;
  value: string;
  onChange: (value: string) => void;
  onSave?: () => void;
  onPublish?: () => void;
  onExecute?: () => void;
  onMoveToDraft?: () => void;
  onValidate?: () => void;
  readOnly?: boolean;
  height?: string;

  isDirty?: boolean;
  workspaceSlug: string;
}

export function SqlEditorComponent({
  procedure,
  value,
  onChange,
  onSave,
  onPublish,
  onExecute,
  onMoveToDraft,
  onValidate,
  readOnly = false,
  height = '400px',
  isDirty = false,
  workspaceSlug,
}: SqlEditorComponentProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [caretPosition, setCaretPosition] = useState({ line: 1, column: 1 });

  // Zustand store for validation state
  const {
    setValidationErrors,
    setValidationWarnings,
    clearValidationForProcedure,
    selectedProcedureId,
    validationErrors: allValidationErrors,
    validationWarnings: allValidationWarnings,
  } = useSqlEditorStore();

  // Get procedure-scoped validation state
  const validationErrors = selectedProcedureId
    ? allValidationErrors[selectedProcedureId] || []
    : [];
  const validationWarnings = selectedProcedureId
    ? allValidationWarnings[selectedProcedureId] || []
    : [];

  const validateMutation = useValidateSql(workspaceSlug);

  // Computed validation result from store
  const validationResult = {
    isValid: validationErrors.length === 0,
    errors: validationErrors,
    warnings: validationWarnings,
  };

  // Debounced validation function
  const validationTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastValidationRef = useRef<string | null>(null);

  const validateSql = useCallback(
    async (sqlContent: string) => {
      if (!workspaceSlug) return;

      // Prevent duplicate validations
      if (sqlContent === lastValidationRef.current) {
        return;
      }

      setIsValidating(true);
      setValidationErrors([]);
      setValidationWarnings([]);

      try {
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Validation timeout')), 10000); // 10 second timeout
        });

        // Race between validation and timeout
        const result = (await Promise.race([
          validateMutation.mutateAsync({ sql: sqlContent }),
          timeoutPromise,
        ])) as any;

        lastValidationRef.current = sqlContent;

        if (result.valid) {
          setValidationErrors([]);
          setValidationWarnings(result.warnings || []);
        } else {
          setValidationErrors(result.errors || []);
          setValidationWarnings(result.warnings || []);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Validation failed';
        setValidationErrors([errorMessage]);
        setValidationWarnings([]);
      } finally {
        setIsValidating(false);
      }
    },
    [workspaceSlug, validateMutation]
  );

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;

    // Configure SQL language features
    const model = editor.getModel();
    if (model) {
      // Track caret position only - disable auto validation for now
      editor.onDidChangeCursorPosition((e) => {
        const position = e.position;
        setCaretPosition({
          line: position.lineNumber,
          column: position.column,
        });
      });

      // Track caret position
      editor.onDidChangeCursorPosition((e) => {
        const position = e.position;
        setCaretPosition({
          line: position.lineNumber,
          column: position.column,
        });
      });
    }
  };

  // Auto-validation with debouncing and timeout
  useEffect(() => {
    if (!value.trim() || !workspaceSlug) {
      setValidationErrors([]);
      setValidationWarnings([]);
      setIsValidating(false);
      return;
    }

    // Clear previous timeout
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    // Set new timeout for debounced validation
    validationTimeoutRef.current = setTimeout(() => {
      // Only validate if content has changed since last validation
      if (value !== lastValidationRef.current) {
        validateSql(value);
      }
    }, 1500); // 1.5 second delay

    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, [value, workspaceSlug]);

  const handleSave = () => {
    if (onSave) {
      onSave();
    }
  };

  const handleValidate = () => {
    if (value.trim() && workspaceSlug) {
      validateSql(value);
    }
  };

  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, []);

  // Clear validation errors when procedure changes or component mounts
  useEffect(() => {
    if (procedure?.id) {
      clearValidationForProcedure(procedure.id);
    }
    setIsValidating(false);
    lastValidationRef.current = null;
  }, [procedure?.id, clearValidationForProcedure]);

  // Also clear validation when editor content changes significantly (new procedure loaded)
  useEffect(() => {
    if (value && value.trim() && procedure?.id) {
      // Check if this looks like a fresh procedure load vs user typing
      const isProcedureTemplate =
        value.includes('CREATE OR ALTER PROCEDURE') &&
        value.includes('-- TODO: Add logic for');

      if (isProcedureTemplate) {
        clearValidationForProcedure(procedure.id);
        lastValidationRef.current = null;
      }
    }
  }, [value, procedure?.id, clearValidationForProcedure]);

  // Listen for validation shortcut
  useEffect(() => {
    const handleValidateEvent = () => {
      handleValidate();
    };

    window.addEventListener('validate-sql', handleValidateEvent);
    return () =>
      window.removeEventListener('validate-sql', handleValidateEvent);
  }, [value, procedure, handleValidate]);

  // Add inline error decorations in Monaco editor using structured issues
  useEffect(() => {
    if (!editorRef.current) return;

    const editor = editorRef.current;
    const model = editor.getModel();
    if (!model) return;

    // Clear previous decorations
    editor.deltaDecorations([], []);

    // Create decorations from validation issues if available
    const allIssues: ValidationIssue[] = [];

    // If we have structured issues from new API, use them
    if (
      validationResult &&
      'issues' in validationResult &&
      Array.isArray(validationResult.issues)
    ) {
      allIssues.push(...validationResult.issues);
    } else {
      // Fallback: create issues from error/warning strings
      if (validationResult?.errors) {
        validationResult.errors.forEach((error) => {
          const lineMatch = error.match(/line\s+(\d+):/i);
          allIssues.push({
            message: error,
            line: lineMatch ? parseInt(lineMatch[1]) : undefined,
            severity: 'error',
          });
        });
      }

      if (validationResult?.warnings) {
        validationResult.warnings.forEach((warning) => {
          const lineMatch = warning.match(/line\s+(\d+):/i);
          allIssues.push({
            message: warning,
            line: lineMatch ? parseInt(lineMatch[1]) : undefined,
            severity: 'warning',
          });
        });
      }
    }

    if (allIssues.length > 0) {
      const decorations: any[] = [];
      const lineCount = model.getLineCount();

      allIssues.forEach((issue) => {
        if (issue.line && issue.line <= lineCount) {
          const isWarning = issue.severity === 'warning';

          decorations.push({
            range: {
              startLineNumber: issue.line,
              startColumn: issue.column || 1,
              endLineNumber: issue.line,
              endColumn: model.getLineMaxColumn(issue.line),
            },
            options: {
              isWholeLine: true,
              className: isWarning
                ? 'line-warning-decoration'
                : 'line-error-decoration',
              hoverMessage: {
                value: `${issue.severity.toUpperCase()}: ${issue.message}${
                  issue.near ? ` (near '${issue.near}')` : ''
                }${issue.code ? ` [Code: ${issue.code}]` : ''}`,
              },
              glyphMarginClassName: isWarning
                ? 'warning-glyph-margin'
                : 'error-glyph-margin',
              minimap: {
                color: isWarning ? '#f59e0b' : '#ef4444',
                position: 2,
              },
            },
          });
        }
      });

      editor.deltaDecorations([], decorations);
    }
  }, [validationResult]);

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col">
        {/* Validation Error Banner */}
        {validationResult && !validationResult.isValid && !isValidating && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">
                  Syntax Error{validationResult.errors.length !== 1 ? 's' : ''}{' '}
                  Detected
                </span>
                <span className="text-sm text-red-600">
                  ({validationResult.errors.length} error
                  {validationResult.errors.length !== 1 ? 's' : ''})
                  {validationResult.warnings.length > 0 && (
                    <>
                      , {validationResult.warnings.length} warning
                      {validationResult.warnings.length !== 1 ? 's' : ''}
                    </>
                  )}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Trigger a global event to switch to validation tab
                  window.dispatchEvent(
                    new CustomEvent('switch-to-validation-tab')
                  );
                }}
                className="text-red-600 hover:text-red-700 hover:bg-red-100"
              >
                View Details
              </Button>
            </div>
          </div>
        )}

        {/* Monaco Editor */}
        <div className="flex-1">
          <Editor
            height={height}
            defaultLanguage="sql"
            value={value}
            onChange={(newValue) => onChange(newValue || '')}
            onMount={handleEditorDidMount}
            options={{
              readOnly: readOnly || procedure?.status === 'published',
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              roundedSelection: false,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              insertSpaces: true,
              wordWrap: 'on',
              bracketPairColorization: { enabled: true },
              suggest: {
                showKeywords: true,
                showSnippets: true,
              },
              quickSuggestions: {
                other: true,
                comments: false,
                strings: false,
              },
            }}
            theme="vs-light"
          />
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between px-3 py-2 border-t bg-muted/30">
          <div className="flex items-center gap-4">
            {/* Validation Status */}
            {isValidating && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground cursor-help">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Validating...</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">Checking SQL syntax...</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Validation runs automatically 1.5s after you stop typing
                  </p>
                </TooltipContent>
              </Tooltip>
            )}

            {validationResult && !isValidating && (
              <div className="flex items-center gap-2">
                {validationResult.isValid ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 text-sm text-green-600 cursor-help">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-medium">Valid</span>
                        {validationResult.warnings.length > 0 && (
                          <span className="text-yellow-600 ml-1">
                            ({validationResult.warnings.length} warning
                            {validationResult.warnings.length !== 1 ? 's' : ''})
                          </span>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm">
                        SQL syntax is valid
                        {validationResult.warnings.length > 0
                          ? ' but has warnings'
                          : ''}
                      </p>
                      {validationResult.warnings.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Check warnings tab for best practice recommendations
                        </p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 text-sm text-red-600 font-medium cursor-help">
                        <AlertCircle className="h-4 w-4 animate-pulse" />
                        <span>
                          {validationResult.errors.length} Error
                          {validationResult.errors.length !== 1 ? 's' : ''}
                        </span>
                        {validationResult.warnings.length > 0 && (
                          <span className="text-yellow-600 ml-1">
                            +{validationResult.warnings.length} Warning
                            {validationResult.warnings.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm font-medium">
                        SQL syntax validation failed
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Click "View Details" or check Messages tab for error
                        details
                      </p>
                      {validationResult.errors.length > 0 && (
                        <div className="mt-2 max-w-xs">
                          <p className="text-xs font-medium">First error:</p>
                          <p className="text-xs text-red-600 truncate">
                            {validationResult.errors[0]}
                          </p>
                        </div>
                      )}
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            )}

            {procedure && (
              <Badge
                variant={
                  procedure.status === 'published' ? 'default' : 'secondary'
                }
                className="text-xs"
              >
                {procedure.status}
              </Badge>
            )}

            {isDirty && (
              <span className="text-xs text-orange-600 font-medium">
                ● Unsaved
              </span>
            )}

            <span className="text-xs text-muted-foreground">
              Ln {caretPosition.line}, Col {caretPosition.column}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Draft mode actions */}
            {procedure?.status === 'draft' && !readOnly && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSave}
                      disabled={!isDirty}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm">Save procedure</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Save current changes to draft
                    </p>
                  </TooltipContent>
                </Tooltip>

                {onValidate && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onValidate}
                        disabled={isValidating}
                      >
                        {isValidating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm">Validate SQL syntax</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Check for syntax errors and warnings
                      </p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {onPublish && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={onPublish}
                        disabled={currentValidationErrors.length > 0}
                      >
                        <Rocket className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm">Publish procedure</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Make available for execution
                      </p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </>
            )}

            {/* Published mode actions */}
            {procedure?.status === 'published' && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (onMoveToDraft) {
                          onMoveToDraft();
                        }
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm">Move to draft</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Create editable version
                    </p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        if (onExecute) {
                          onExecute();
                        }
                      }}
                      disabled={isValidating}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm">Execute procedure</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Run with parameters
                    </p>
                  </TooltipContent>
                </Tooltip>
              </>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
