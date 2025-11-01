import { createFileRoute, redirect, Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from '@tanstack/react-form';
import {
  ArrowLeft,
  Save,
  Plus,
  CheckCircle,
  XCircle,
  Code,
  Edit,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTemplateQuery, useUpdateTemplateMutation } from '@/features/admin/hooks';
import { type TemplateParameter } from '@/features/admin/api';

const templateFormSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  description: z.string().optional(),
  sqlTemplate: z.string().min(1, 'SQL template is required'),
});

type TemplateFormData = z.infer<typeof templateFormSchema>;

export const Route = createFileRoute('/_dashboard/admin/templates/$id/edit')({
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
  component: TemplateEditor,
});

function TemplateEditor() {
  const { id } = Route.useParams();
  const { data: template, isLoading, error } = useTemplateQuery(id);
  const updateTemplateMutation = useUpdateTemplateMutation();

  const [editingParameter, setEditingParameter] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      name: '',
      description: '',
      sqlTemplate: '',
    },
    onSubmit: async ({ value }) => {
      handleSave(value);
    },
  });

  useEffect(() => {
    if (template) {
      form.reset({
        name: template.name,
        description: template.description || '',
        sqlTemplate: template.sqlTemplate,
      });
    }
  }, [template, form]);

  const handleSave = async (data: TemplateFormData) => {
    try {
      await updateTemplateMutation.mutateAsync({
        id,
        data,
      });
    } catch (error) {
      console.error('Failed to save template:', error);
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

  const sqlTemplate = form.getFieldValue('sqlTemplate');
  const placeholders = extractPlaceholders(sqlTemplate || '');
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
          <h1 className="text-3xl font-bold tracking-tight">Edit Template</h1>
          <p className="text-muted-foreground">{template.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => form.handleSubmit()}
            disabled={updateTemplateMutation.isPending}
          >
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
        </div>
      </div>

      <Form>
        <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="space-y-6">
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
                  <form.Field
                    name="name"
                    validators={{
                      onChange: ({ value }) => templateFormSchema.shape.name.safeParse(value),
                    }}
                    children={(field) => (
                      <FormItem>
                        <FormLabel>Template Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter template name"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                          />
                        </FormControl>
                        <FormMessage>
                          {field.state.meta.isTouched && !field.state.meta.isValid && 'Invalid value'}
                        </FormMessage>
                      </FormItem>
                    )}
                  />
                  <form.Field
                    name="description"
                    children={(field) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe what this template does"
                            rows={3}
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                          />
                        </FormControl>
                        <FormMessage>
                          {field.state.meta.isTouched && !field.state.meta.isValid && 'Invalid value'}
                        </FormMessage>
                      </FormItem>
                    )}
                  />
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
                    SQL template with {`{{placeholder}}`} syntax. Must include {`{{procedureName}}`}.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form.Field
                    name="sqlTemplate"
                    validators={{
                      onChange: ({ value }) => templateFormSchema.shape.sqlTemplate.safeParse(value),
                    }}
                    children={(field) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="CREATE OR ALTER PROCEDURE {{procedureName}} ..."
                            rows={12}
                            className="font-mono text-sm"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                          />
                        </FormControl>
                        <FormMessage>
                          {field.state.meta.isTouched && !field.state.meta.isValid && 'Invalid value'}
                        </FormMessage>
                      </FormItem>
                    )}
                  />
                  
                  {/* Placeholders detected */}
                  {placeholders.length > 0 && (
                    <div className="mt-4">
                      <FormLabel>Detected Placeholders</FormLabel>
                      <div className="flex flex-wrap gap-2 mt-2">
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

            {/* Right Column - Parameters */}
            <div className="space-y-6">
              {/* Parameters */}
              <Card>
                <CardHeader>
                  <CardTitle>Parameters</CardTitle>
                  <CardDescription>
                    Define parameters for the template
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(paramsSchema).map(([key, param]) => (
                      <ParameterItem
                        key={key}
                        name={key}
                        parameter={param}
                        isEditing={editingParameter === key}
                        onEdit={() => setEditingParameter(key)}
                        onSave={() => setEditingParameter(null)}
                        onCancel={() => setEditingParameter(null)}
                      />
                    ))}
                    
                    {editingParameter === 'new' && (
                      <NewParameterForm
                        onSave={() => {
                          // Handle save new parameter
                          setEditingParameter(null);
                        }}
                        onCancel={() => setEditingParameter(null)}
                      />
                    )}
                    
                    {editingParameter !== 'new' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingParameter('new')}
                        className="w-full"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Parameter
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}

interface ParameterItemProps {
  name: string;
  parameter: TemplateParameter;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}

function ParameterItem({ name, parameter, isEditing, onEdit, onSave, onCancel }: ParameterItemProps) {
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
      <div className="flex items-center gap-2">
        {isEditing ? (
          <>
            <Button size="sm" onClick={onSave}>
              <CheckCircle className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={onCancel}>
              <XCircle className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

interface NewParameterFormProps {
  onSave: () => void;
  onCancel: () => void;
}

function NewParameterForm({ onSave, onCancel }: NewParameterFormProps) {
  return (
    <div className="p-3 border rounded-lg bg-muted/30">
      <div className="space-y-3">
        <Input placeholder="Parameter name" />
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="string">String</SelectItem>
            <SelectItem value="number">Number</SelectItem>
            <SelectItem value="boolean">Boolean</SelectItem>
            <SelectItem value="enum">Enum</SelectItem>
            <SelectItem value="identifier">Identifier</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Switch />
          <span className="text-sm">Required</span>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={onSave}>
            <CheckCircle className="h-4 w-4 mr-1" />
            Add
          </Button>
          <Button size="sm" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}