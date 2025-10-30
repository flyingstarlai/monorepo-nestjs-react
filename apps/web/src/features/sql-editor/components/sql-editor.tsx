import { useRef, useEffect, useState, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Loader2, Rocket } from 'lucide-react';
import { useValidateSql } from '../hooks/use-sql-editor';
import { useSqlEditorStore } from '../stores/sql-editor.store';
import type { StoredProcedure } from '../types';

interface SqlEditorComponentProps {
  procedure: StoredProcedure | null;
  value: string;
  onChange: (value: string) => void;
  onSave?: () => void;
  onPublish?: () => void;
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

  return (
    <div className="h-full flex flex-col">
      {/* Monaco Editor */}
      <div className="flex-1">
        <Editor
          height={height}
          defaultLanguage="sql"
          value={value}
          onChange={(newValue) => onChange(newValue || '')}
          onMount={handleEditorDidMount}
          options={{
            readOnly,
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
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Validating...
            </div>
          )}

          {validationResult && !isValidating && (
            <div className="flex items-center gap-2">
              {validationResult.isValid ? (
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  Valid
                </div>
              ) : (
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {validationResult.errors.length} Error
                  {validationResult.errors.length !== 1 ? 's' : ''}
                </div>
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
          <Button
            variant="outline"
            size="sm"
            onClick={handleValidate}
            disabled={!value.trim() || isValidating}
          >
            Validate
          </Button>

          {onPublish && procedure?.status === 'draft' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onPublish}
              disabled={
                !value.trim() || isValidating || !validationResult.isValid
              }
              className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200 hover:border-green-300"
            >
              <Rocket className="h-3.5 w-3.5 mr-1.5" />
              Publish
            </Button>
          )}

          {onSave && !readOnly && (
            <Button size="sm" onClick={handleSave}>
              Save
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
