import { useState, useEffect } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Code, AlertTriangle, XCircle } from 'lucide-react';
import { SqlEditorComponent } from './sql-editor';

import { useTemplatesQuery, useRenderTemplateMutation } from '@/features/admin/hooks';
import { useCreateProcedure, useUpdateProcedure } from '@/features/sql-editor/hooks/use-sql-editor';
import type { StoredProcedure } from '../types';


interface ProcedureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceSlug: string;
  procedure?: StoredProcedure | null;
  onSuccess?: (createdProcedure?: StoredProcedure) => void;
}

export function ProcedureDialogWithTemplates({
  open,
  onOpenChange,
  workspaceSlug,
  procedure,
  onSuccess,
}: ProcedureDialogProps) {
  const isEditing = !!procedure;
  const createMutation = useCreateProcedure(workspaceSlug);
  const updateMutation = useUpdateProcedure(workspaceSlug, procedure?.id || '');
  const { data: templates = [] } = useTemplatesQuery();
  const renderTemplateMutation = useRenderTemplateMutation();

  const [formData, setFormData] = useState({
    name: procedure?.name || '',
    sqlDraft: procedure?.sqlDraft || '',
  });

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [templateParameters, setTemplateParameters] = useState<Record<string, any>>({});
  const [templateErrors, setTemplateErrors] = useState<string[]>([]);
  const [templateWarnings, setTemplateWarnings] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'manual' | 'template'>('manual');

  const [errors, setErrors] = useState<{
    name?: string;
    sqlDraft?: string;
  }>({});

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setFormData({
        name: procedure?.name || '',
        sqlDraft: procedure?.sqlDraft || '',
      });
      setSelectedTemplateId('');
      setTemplateParameters({});
      setTemplateErrors([]);
      setTemplateWarnings([]);
      setActiveTab(isEditing ? 'manual' : 'template');
      setErrors({});
    }
  }, [open, procedure]);

  // Auto-render template when selection or parameters change
  useEffect(() => {
    if (selectedTemplate && formData.name) {
      renderTemplate();
    }
  }, [selectedTemplateId, templateParameters, formData.name]);

  const renderTemplate = async () => {
    if (!selectedTemplate || !formData.name) return;

    try {
      const result = await renderTemplateMutation.mutateAsync({
        id: selectedTemplate.id,
        data: {
          procedureName: formData.name,
          parameters: templateParameters,
        },
      });

      setFormData(prev => ({ ...prev, sqlDraft: result.renderedSql }));
      setTemplateErrors(result.errors || []);
      setTemplateWarnings(result.warnings || []);
    } catch (error) {
      console.error('Failed to render template:', error);
      setTemplateErrors(['Failed to render template']);
    }
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Procedure name is required';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Name must be less than 100 characters';
    }

    if (!formData.sqlDraft.trim()) {
      newErrors.sqlDraft = 'SQL code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      let result: StoredProcedure | undefined;

      if (isEditing && procedure) {
        result = await updateMutation.mutateAsync(formData);
      } else {
        result = await createMutation.mutateAsync(formData);
      }

      onSuccess?.(result);
      onOpenChange(false);
      setFormData({ name: '', sqlDraft: '' });
      setErrors({});
    } catch {
      // Error is handled by mutation
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false);
      setFormData({ name: '', sqlDraft: '' });
      setErrors({});
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find(t => t.id === templateId);
    
      if (template) {
        // Set default parameter values
        const defaults: Record<string, any> = {};
        if (template.paramsSchema) {
          Object.entries(template.paramsSchema).forEach(([key, param]) => {
            if (param.default !== undefined) {
              defaults[key] = param.default;
            } else if (param.type === 'string') {
              defaults[key] = '';
            } else if (param.type === 'number') {
              defaults[key] = 0;
            } else if (param.type === 'identifier') {
              defaults[key] = '';
            }
          });
        }
        setTemplateParameters(defaults);
      }
  };

  const handleParameterChange = (paramName: string, value: any) => {
    setTemplateParameters(prev => ({ ...prev, [paramName]: value }));
  };

  const renderParameterInput = (paramName: string, param: any) => {
    const value = templateParameters[paramName] ?? param.default ?? '';

    switch (param.type) {
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleParameterChange(paramName, Number(e.target.value))}
            placeholder={`Enter ${paramName}`}
          />
        );
      case 'string':
        return (
          <Input
            value={value}
            onChange={(e) => handleParameterChange(paramName, e.target.value)}
            placeholder={`Enter ${paramName}`}
          />
        );
      case 'identifier':
        return (
          <Input
            value={value}
            onChange={(e) => handleParameterChange(paramName, e.target.value)}
            placeholder={`Enter ${paramName}`}
          />
        );
      default:
        return (
          <Input
            value={value}
            onChange={(e) => handleParameterChange(paramName, e.target.value)}
            placeholder={`Enter ${paramName}`}
          />
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Procedure' : 'Create New Procedure'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modify the stored procedure name and SQL code.'
              : 'Create a new stored procedure for your workspace, starting from a template or from scratch.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col h-full gap-4">
          <div className="space-y-4">
            {/* Procedure Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Procedure Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter procedure name"
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>
          </div>

          {/* Template Selection / Manual Entry */}
          {!isEditing && (
            <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="template" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Use Template
                </TabsTrigger>
                <TabsTrigger value="manual" className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Start from Scratch
                </TabsTrigger>
              </TabsList>

              <TabsContent value="template" className="space-y-4">
                {/* Template Selection */}
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Select Template</Label>
                    <Select value={selectedTemplateId} onValueChange={handleTemplateSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span>{template.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Template Info */}
                  {selectedTemplate && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">{selectedTemplate.name}</CardTitle>
                        {selectedTemplate.description && (
                          <CardDescription className="text-xs">
                            {selectedTemplate.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="text-xs text-muted-foreground">
                          {selectedTemplate.paramsSchema && Object.keys(selectedTemplate.paramsSchema).length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(selectedTemplate.paramsSchema).map(([key, param]) => (
                                <Badge key={key} variant="outline" className="text-xs">
                                  {key} ({param.type})
                                  {param.required && <span className="text-red-500 ml-1">*</span>}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Template Parameters */}
                {selectedTemplate && selectedTemplate.paramsSchema && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Template Parameters</CardTitle>
                      <CardDescription>
                        Configure parameters for the selected template
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2">
                        {Object.entries(selectedTemplate.paramsSchema).map(([paramName, param]) => (
                          <div key={paramName} className="space-y-2">
                            <Label className="text-sm">
                              {paramName}
                              {param.required && <span className="text-red-500 ml-1">*</span>}
                              <span className="text-muted-foreground ml-1">({param.type})</span>
                            </Label>
                            {renderParameterInput(paramName, param)}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Template Errors/Warnings */}
                {(templateErrors.length > 0 || templateWarnings.length > 0) && (
                  <div className="space-y-2">
                    {templateErrors.map((error, index) => (
                      <Alert key={index} variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    ))}
                    {templateWarnings.map((warning, index) => (
                      <Alert key={index} variant="default" className="border-yellow-200 bg-yellow-50">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-800">{warning}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="manual">
                <div className="text-center py-8 text-muted-foreground">
                  <Code className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>Start writing your SQL procedure from scratch</p>
                </div>
              </TabsContent>
            </Tabs>
          )}

          {/* SQL Editor */}
          <div className="flex-1 min-h-0">
            <SqlEditorComponent
              procedure={procedure || null}
              value={formData.sqlDraft}
              onChange={(value) => handleInputChange('sqlDraft', value)}
              readOnly={isLoading || (activeTab === 'template' && !!selectedTemplate)}
              height="400px"
              workspaceSlug={workspaceSlug}
            />
            {errors.sqlDraft && (
              <Alert variant="destructive" className="mt-2">
                <AlertDescription>{errors.sqlDraft}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? 'Saving...'
                : isEditing
                  ? 'Update Procedure'
                  : 'Create Procedure'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}