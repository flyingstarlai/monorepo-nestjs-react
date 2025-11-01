import { createFileRoute, redirect, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { z } from 'zod';
import { useForm } from '@tanstack/react-form';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  CheckCircle,
  Code,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useCreateTemplateMutation } from '@/features/admin/hooks';
import { type TemplateParameter, type TemplateParamsSchema } from '@/features/admin/api';

const templateFormSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  description: z.string().optional(),
  sqlTemplate: z.string().min(1, 'SQL template is required'),
});

type TemplateFormData = z.infer<typeof templateFormSchema>;

export const Route = createFileRoute('/_dashboard/admin/templates/new')({
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
  component: NewTemplate,
});

function NewTemplate() {
  const createTemplateMutation = useCreateTemplateMutation();

  const [paramsSchema, setParamsSchema] = useState<TemplateParamsSchema>({});
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

  const handleSave = async (data: TemplateFormData) => {
    try {
      await createTemplateMutation.mutateAsync({
        ...data,
        paramsSchema: Object.keys(paramsSchema).length > 0 ? paramsSchema : undefined,
      });
    } catch (error) {
      console.error('Failed to create template:', error);
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

  const addParameter = (name: string, parameter: TemplateParameter) => {
    setParamsSchema(prev => ({
      ...prev,
      [name]: parameter,
    }));
    setEditingParameter(null);
  };

  const removeParameter = (name: string) => {
    setParamsSchema(prev => {
      const newSchema = { ...prev };
      delete newSchema[name];
      return newSchema;
    });
  };

  const sqlTemplate = form.getFieldValue('sqlTemplate');
  const placeholders = extractPlaceholders(sqlTemplate || '');

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
          <h1 className="text-3xl font-bold tracking-tight">Create Template</h1>
          <p className="text-muted-foreground">Create a new procedure template</p>
        </div>
        <Button
          onClick={() => form.handleSubmit()}
          disabled={createTemplateMutation.isPending}
        >
          <Save className="mr-2 h-4 w-4" />
          Create Template
        </Button>
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
                      onChange: ({ value }) => {
                        const res = templateFormSchema.shape.name.safeParse(value);
                        return res.success ? undefined : res.error.issues[0]?.message || 'Invalid value';
                      },
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
                          {field.state.meta.isTouched && !field.state.meta.isValid && (field.state.meta.errors?.[0] ?? 'Invalid value')}
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
                          {field.state.meta.isTouched && !field.state.meta.isValid && (field.state.meta.errors?.[0] ?? 'Invalid value')}
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
                      onChange: ({ value }) => {
                        const res = templateFormSchema.shape.sqlTemplate.safeParse(value);
                        return res.success ? undefined : res.error.issues[0]?.message || 'Invalid value';
                      },
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
                          {field.state.meta.isTouched && !field.state.meta.isValid && (field.state.meta.errors?.[0] ?? 'Invalid value')}
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
                        onRemove={() => removeParameter(key)}
                      />
                    ))}
                    
                    {editingParameter === 'new' && (
                      <NewParameterForm
                        onAdd={addParameter}
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

              {/* Template Help */}
              <Card>
                <CardHeader>
                  <CardTitle>Template Guide</CardTitle>
                  <CardDescription>
                    How to create effective templates
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                   <div>
                     <strong>Required:</strong> Include {`{{procedureName}}`} in your CREATE PROCEDURE header
                   </div>
                   <div>
                     <strong>Syntax:</strong> Use {`{{placeholder}}`} for parameter substitution
                   </div>
                  <div>
                     <strong>Types:</strong> identifier, string, number
                  </div>
                  <div>
                     <strong>identifier:</strong> Use for SQL identifiers (table/column names), include [] in SQL if needed
                  </div>
                  <div>
                    <strong>Validation:</strong> Template is validated on save
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
  onRemove: () => void;
}

function ParameterItem({ name, parameter, onRemove }: ParameterItemProps) {
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
      <Button
        size="sm"
        variant="outline"
        onClick={onRemove}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

interface NewParameterFormProps {
  onAdd: (name: string, parameter: TemplateParameter) => void;
  onCancel: () => void;
}

function NewParameterForm({ onAdd, onCancel }: NewParameterFormProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<TemplateParameter['type']>('string');
  const [required, setRequired] = useState(false);
  const [defaultValue, setDefaultValue] = useState('');

  const handleAdd = () => {
    if (!name.trim()) return;

    const parameter: TemplateParameter = {
      name: name.trim(),
      type,
      required,
      ...(defaultValue && { default: defaultValue }),
    };

    onAdd(name.trim(), parameter);
    setName('');
    setDefaultValue('');
    setRequired(false);
    setType('string');
  };

  return (
    <div className="p-3 border rounded-lg bg-muted/30">
      <div className="space-y-3">
        <Input
          placeholder="Parameter name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Select value={type} onValueChange={(value: any) => setType(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="identifier">identifier</SelectItem>
            <SelectItem value="string">string</SelectItem>
            <SelectItem value="number">number</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder="Default value (optional)"
          value={defaultValue}
          onChange={(e) => setDefaultValue(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <Switch
            checked={required}
            onCheckedChange={setRequired}
          />
          <span className="text-sm">Required</span>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleAdd}>
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