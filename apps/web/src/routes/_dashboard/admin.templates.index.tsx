import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Eye,
  Code,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useTemplatesQuery, useDeleteTemplateMutation } from '@/features/admin/hooks';
import { type ProcedureTemplate } from '@/features/admin/api';

export const Route = createFileRoute('/_dashboard/admin/templates/')({
  component: AdminTemplates,
});

function AdminTemplates() {
  const { data: templates = [], isLoading, error } = useTemplatesQuery();
  const deleteTemplateMutation = useDeleteTemplateMutation();

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await deleteTemplateMutation.mutateAsync(templateId);
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  if (error) {
    return (
      <div className="flex-1 space-y-6">
        <div className="text-center py-12">
          <XCircle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-semibold text-red-600">Error loading templates</h3>
          <p className="mt-1 text-sm text-red-500">
            {error instanceof Error ? error.message : 'Failed to load templates'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Procedure Templates
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage reusable SQL procedure templates for the platform
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/templates/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Link>
        </Button>
      </div>

      {/* Templates Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          [...Array(6)].map((_, i) => (
            <Card key={i} className="w-full">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full mb-4" />
                <div className="flex justify-between">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : templates.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold text-muted-foreground">No templates</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Get started by creating your first procedure template.
            </p>
            <div className="mt-6">
              <Button asChild>
                <Link to="/admin/templates/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Template
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onDelete={() => handleDeleteTemplate(template.id)}
              isDeleting={deleteTemplateMutation.isPending}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface TemplateCardProps {
  template: ProcedureTemplate;
  onDelete: () => void;
  isDeleting: boolean;
}

function TemplateCard({ template, onDelete, isDeleting }: TemplateCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const getParameterCount = () => {
    if (!template.paramsSchema) return 0;
    return Object.keys(template.paramsSchema).length;
  };

  const getRequiredCount = () => {
    if (!template.paramsSchema) return 0;
    return Object.values(template.paramsSchema).filter(param => param.required).length;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Code className="h-4 w-4" />
              {template.name}
            </CardTitle>
            {template.description && (
              <CardDescription className="mt-1 line-clamp-2">
                {template.description}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Template preview */}
          <div className="bg-muted/50 rounded-md p-3">
            <pre className="text-xs text-muted-foreground font-mono line-clamp-3 overflow-hidden">
              {template.sqlTemplate}
            </pre>
          </div>

          {/* Template stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Code className="h-3 w-3" />
              <span>{getParameterCount()} params</span>
            </div>
            {getRequiredCount() > 0 && (
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                <span>{getRequiredCount()} required</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <Button asChild variant="outline" size="sm" className="flex-1">
              <Link to="/admin/templates/$id/edit" params={{ id: template.id }}>
                <Edit className="mr-2 h-3 w-3" />
                Edit
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="flex-1">
              <Link to="/admin/templates/$id/preview" params={{ id: template.id }}>
                <Eye className="mr-2 h-3 w-3" />
                Preview
              </Link>
            </Button>
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={isDeleting}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Template</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete template "{template.name}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      onDelete();
                      setShowDeleteDialog(false);
                    }}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}