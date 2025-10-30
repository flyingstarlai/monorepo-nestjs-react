import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Database,
  Edit,
  Trash2,
  Play,
  Upload,
  MoreHorizontal,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import type { StoredProcedure } from '../types';

interface ProcedureListProps {
  procedures: StoredProcedure[] | undefined;
  isLoading: boolean;
  selectedProcedureId: string | null;
  onSelectProcedure: (id: string) => void;
  onCreateProcedure: () => void;
  onEditProcedure: (id: string) => void;
  onDeleteProcedure: (id: string) => void;
  onPublishProcedure: (id: string) => void;
  onExecuteProcedure: (id: string) => void;
}

export function ProcedureList({
  procedures,
  isLoading,
  selectedProcedureId,
  onSelectProcedure,
  onCreateProcedure,
  onEditProcedure,
  onDeleteProcedure,
  onPublishProcedure,
  onExecuteProcedure,
}: ProcedureListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [procedureToDelete, setProcedureToDelete] = useState<string | null>(
    null
  );

  const handleDeleteClick = (id: string) => {
    setProcedureToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (procedureToDelete) {
      onDeleteProcedure(procedureToDelete);
    }
    setDeleteDialogOpen(false);
    setProcedureToDelete(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stored Procedures</CardTitle>
          <CardDescription>Procedures in this workspace</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg border"
              >
                <Skeleton className="h-8 w-8 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16 rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Stored Procedures</CardTitle>
              <CardDescription>Procedures in this workspace</CardDescription>
            </div>
            <Button size="sm" onClick={onCreateProcedure}>
              <Plus className="h-4 w-4 mr-2" />
              Create
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {procedures && procedures.length > 0 ? (
            <div className="space-y-2">
              {procedures.map((procedure) => (
                <div
                  key={procedure.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedProcedureId === procedure.id
                      ? 'bg-muted border-primary'
                      : ''
                  }`}
                  onClick={() => onSelectProcedure(procedure.id)}
                >
                  <Database className="h-5 w-5 text-muted-foreground flex-shrink-0" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{procedure.name}</p>
                      <Badge
                        variant={
                          procedure.status === 'published'
                            ? 'default'
                            : 'secondary'
                        }
                        className="text-xs"
                      >
                        {procedure.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {procedure.publishedAt
                        ? `Published ${formatDistanceToNow(
                            new Date(procedure.publishedAt),
                            {
                              addSuffix: true,
                            }
                          )}`
                        : `Created ${formatDistanceToNow(
                            new Date(procedure.createdAt),
                            {
                              addSuffix: true,
                            }
                          )}`}
                    </p>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditProcedure(procedure.id);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>

                      {procedure.status === 'draft' && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onPublishProcedure(procedure.id);
                          }}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Publish
                        </DropdownMenuItem>
                      )}

                      {procedure.status === 'published' && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onExecuteProcedure(procedure.id);
                          }}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Execute
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(procedure.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No procedures found</p>
              <p className="text-xs">
                Create your first stored procedure to get started
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Procedure</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this stored procedure? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
