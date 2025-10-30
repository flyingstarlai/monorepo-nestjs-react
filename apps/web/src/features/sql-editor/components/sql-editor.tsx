import { useRef, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
}

export function SqlEditorComponent({
  procedure,
  value,
  onChange,
  onSave,
  readOnly = false,
  height = '500px',
}: SqlEditorComponentProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [isValidating, setIsValidating] = useState(false);

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
    }
  };

  // Debounced validation function
  let validationTimeout: NodeJS.Timeout;
  const debouncedValidate = (sql: string) => {
    clearTimeout(validationTimeout);
    setIsValidating(true);

    validationTimeout = setTimeout(() => {
      validateSql(sql);
    }, 1000); // 1 second debounce
  };

  const validateSql = async (sql: string) => {
    if (!procedure?.workspaceId) return;

    try {
      const result = await validateMutation.mutateAsync({ sql });
      setValidationErrors(result.errors);
      setValidationWarnings(result.warnings);
    } catch (error) {
      setValidationErrors(['Validation failed']);
      setValidationWarnings([]);
    } finally {
      setIsValidating(false);
    }
  };

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
      clearTimeout(validationTimeout);
    };
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Editor Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">SQL Editor</span>
          {procedure && (
            <Badge
              variant={
                procedure.status === 'published' ? 'default' : 'secondary'
              }
            >
              {procedure.status}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
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

      {/* Validation Errors/Warnings */}
      {validationResult && !validationResult.isValid && (
        <div className="border-b">
          {validationResult.errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">SQL Errors:</p>
                  {validationResult.errors.map((error, index) => (
                    <p key={index} className="text-sm">
                      • {error}
                    </p>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {validationResult.warnings.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">Warnings:</p>
                  {validationResult.warnings.map((warning, index) => (
                    <p key={index} className="text-sm">
                      • {warning}
                    </p>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}
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
          theme="vs-dark"
        />
      </div>
    </div>
  );
}
