import { createFileRoute, redirect, Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Eye,
  AlertTriangle,
  XCircle,
  Code,
  Edit,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useTemplateQuery, useRenderTemplateMutation } from '@/features/admin/hooks';
import { type TemplateParameter } from '@/features/admin/api';

export const Route = createFileRoute('/_dashboard/admin/templates/$id/preview')({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      });
    }

    // Check if user has admin role
    if (context.auth.user?.role !== 'Admin') {
      throw redirect({
        to: '/',
      });
    }
  },
  component: TemplatePreview,
});

function TemplatePreview() {
  const { id } = Route.useParams();
  const { data: template, isLoading, error } = useTemplateQuery(id);
  const renderTemplateMutation = useRenderTemplateMutation();

  const [previewSql, setPreviewSql] = useState<string>('');
  const [previewErrors, setPreviewErrors] = useState<string[]>([]);
  const [previewWarnings, setPreviewWarnings] = useState<string[]>([]);

  useEffect(() => {
    if (template) {
      handlePreview();
    }
  }, [template]);

  const handlePreview = async () => {
    const paramsSchema = template?.paramsSchema || {};

    try {
      const result = await renderTemplateMutation.mutateAsync({
        id,
        data: {
          procedureName: 'SampleProcedure',
          parameters: Object.fromEntries(
            Object.entries(paramsSchema).map(([key, param]) => [
              key,
              param.default !== undefined
                ? param.default
                : param.type === 'string'
                  ? ''
                  : param.type === 'number'
                    ? 0
                    : param.type === 'identifier'
                      ? ''
                      : ''
            ])
          ),
        },
      });

      setPreviewSql(result.renderedSql);
      setPreviewErrors(result.errors || []);
      setPreviewWarnings(result.warnings || []);
    } catch (error) {
      console.error('Failed to preview template:', error);
    }
  };

  const extractPlaceholders = (sql: string): string[] => {
    const placeholderRegex = /\{\{([A-Za-z0-9_]+)\}\}/g;
    const placeholders: string[] = [];
    let match;

    while ((match = placeholderRegex.exec(sql)) !== null) {
      placeholders.push(match[1]);
    }

    return [...new Set(placeholders)];
  };

  const placeholders = extractPlaceholders(template?.sqlTemplate || '');
  const paramsSchema = template?.paramsSchema || {};

  if (error) {
    return (
      <div className="flex-1 space-y-6">
        <div className="text-center py-12">
          <XCircle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-semibold text-red-600">Error loading template</h3>
          <p className="mt-1 text-sm text-red-500">
            {error instanceof Error ? error.message : 'Failed to load template'}
          </p>
        </div>
      </div>
    );
  }

  if (isLoading || !template) {
    return (
      <div className="flex-1 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link to="/admin/templates">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Templates
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Preview Template</h1>
          <p className="text-muted-foreground">{template.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link to="/admin/templates/$id/edit" params={{ id }}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Template Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Template Information</CardTitle>
              <CardDescription>
                Basic information about the procedure template
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium">Name</h4>
                <p className="text-sm text-muted-foreground">{template.name}</p>
              </div>
              {template.description && (
                <div>
                  <h4 className="font-medium">Description</h4>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SQL Template */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                SQL Template
              </CardTitle>
              <CardDescription>
                SQL template with {`{{placeholder}}`} syntax
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 rounded-md p-4">
                <pre className="text-sm text-muted-foreground font-mono whitespace-pre-wrap">
                  {template.sqlTemplate}
                </pre>
              </div>
              
              {/* Placeholders detected */}
              {placeholders.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Detected Placeholders</h4>
                  <div className="flex flex-wrap gap-2">
                    {placeholders.map((placeholder) => (
                      <Badge
                        key={placeholder}
                        variant={placeholder === 'procedureName' ? 'default' : 'secondary'}
                      >
                        {placeholder}
                        {placeholder === 'procedureName' && ' (required)'}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Parameters & Preview */}
        <div className="space-y-6">
          {/* Parameters */}
          <Card>
            <CardHeader>
              <CardTitle>Parameters</CardTitle>
              <CardDescription>
                Parameters defined for this template
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(paramsSchema).map(([key, param]) => (
                  <ParameterItem
                    key={key}
                    name={key}
                    parameter={param}
                  />
                ))}
                {Object.keys(paramsSchema).length === 0 && (
                  <p className="text-sm text-muted-foreground">No parameters defined</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Rendered Preview
              </CardTitle>
              <CardDescription>
                Rendered SQL with sample values
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderTemplateMutation.isPending ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : (
                <>
                  {previewErrors.length > 0 && (
                    <Alert className="mb-4 border-red-200 bg-red-50">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        {previewErrors.join(', ')}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {previewWarnings.length > 0 && (
                    <Alert className="mb-4 border-yellow-200 bg-yellow-50">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        {previewWarnings.join(', ')}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {previewErrors.length === 0 && (
                    <div className="bg-muted/50 rounded-md p-4">
                      <pre className="text-sm text-muted-foreground font-mono whitespace-pre-wrap">
                        {previewSql}
                      </pre>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface ParameterItemProps {
  name: string;
  parameter: TemplateParameter;
}

function ParameterItem({ name, parameter }: ParameterItemProps) {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{name}</span>
          <Badge variant="outline">{parameter.type}</Badge>
          {parameter.required && (
            <Badge variant="default" className="bg-red-100 text-red-800 border-red-200">
              Required
            </Badge>
          )}
        </div>
        {parameter.default !== undefined && (
          <p className="text-sm text-muted-foreground mt-1">
            Default: {String(parameter.default)}
          </p>
        )}
      </div>
    </div>
  );
}