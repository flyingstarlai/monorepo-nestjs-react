import { useRef, useEffect, useState, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useValidateSql } from '../hooks/use-sql-editor';
import { useSqlEditorStore } from '../stores/sql-editor.store';
import type { StoredProcedure } from '../types';

interface SqlEditorComponentProps {
  procedure: StoredProcedure | null;
  value: string;
  onChange: (value: string) => void;
  onSave?: () => void;
  readOnly?: boolean;
  height?: string;
  onValidationError?: (errors: string[], warnings: string[]) => void;
  isDirty?: boolean;
}

export function SqlEditorComponent({
  procedure,
  value,
  onChange,
  onSave,
  readOnly = false,
  height = '500px',
  onValidationError,
  isDirty = false,
}: SqlEditorComponentProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [caretPosition, setCaretPosition] = useState({ line: 1, column: 1 });

  // Zustand store for validation state
  const {
    validationErrors,
    validationWarnings,
    setValidationErrors,
    setValidationWarnings,
  } = useSqlEditorStore();

  const validateMutation = useValidateSql(procedure?.workspaceId || '');

  // Computed validation result from store
  const validationResult = {
    isValid: validationErrors.length === 0,
    errors: validationErrors,
    warnings: validationWarnings,
  };

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;

    // Configure SQL language features
    const model = editor.getModel();
    if (model) {
      // Set basic SQL validation
      editor.onDidChangeModelContent(() => {
        const value = model.getValue();
        if (value.trim()) {
          debouncedValidate(value);
        } else {
          setValidationErrors([]);
          setValidationWarnings([]);
        }
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

  // Debounced validation function
  const validationTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const debouncedValidate = (sql: string) => {
    clearTimeout(validationTimeoutRef.current);
    setIsValidating(true);

    validationTimeoutRef.current = setTimeout(() => {
      validateSql(sql);
    }, 1000); // 1 second debounce
  };

  // Validate on mount if there's content
  useEffect(() => {
    if (value && value.trim()) {
      debouncedValidate(value);
    }
  }, [value, debouncedValidate]);

  const validateSql = useCallback(
    async (sql: string) => {
      if (!procedure?.workspaceId) return;

      try {
        const result = await validateMutation.mutateAsync({ sql });
        setValidationErrors(result.errors);
        setValidationWarnings(result.warnings);

        // Emit validation errors to parent
        onValidationError?.(result.errors, result.warnings);
      } catch {
        const errors = ['Validation failed'];
        setValidationErrors(errors);
        setValidationWarnings([]);

        // Emit validation errors to parent
        onValidationError?.(errors, []);
      } finally {
        setIsValidating(false);
      }
    },
    [procedure?.workspaceId, validateMutation, onValidationError]
  );

  const handleSave = () => {
    if (onSave) {
      onSave();
    }
  };

  const handleValidate = () => {
    if (value.trim() && procedure?.workspaceId) {
      validateSql(value);
    }
  };

  useEffect(() => {
    return () => {
      clearTimeout(validationTimeoutRef.current);
    };
  }, []);

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
