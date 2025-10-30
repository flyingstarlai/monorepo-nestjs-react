import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Database,
  Trash2,
  Play,
  Upload,
  MoreHorizontal,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  selectedProcedureId: string | null;
  onSelectProcedure: (id: string) => void;
  onCreateProcedure: () => void;
  onDeleteProcedure: (id: string) => void;
  onPublishProcedure: (id: string) => void;
  onExecuteProcedure: (id: string) => void;
  readOnly?: boolean;
  isLoading?: boolean;
}

export function ProcedureList({
  procedures,
  isLoading,
  selectedProcedureId,
  onSelectProcedure,
  onCreateProcedure,
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
      <div className="h-full flex flex-col bg-background">
        <div className="px-4 py-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Procedures</h2>
              <p className="text-xs text-muted-foreground">Loading...</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled
              className="h-7 px-3 text-xs"
            >
              <Plus className="h-3 w-3 mr-1.5" />
              New
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {[...Array(5)].map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-2 border-l-2 border-transparent"
            >
              <Skeleton className="h-4 w-4 rounded" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-12 rounded" />
                </div>
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="h-full flex flex-col bg-background">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Procedures</h2>
              <p className="text-xs text-muted-foreground">
                {procedures?.length || 0} {procedures?.length === 1 ? 'procedure' : 'procedures'}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={onCreateProcedure}
              aria-label="Create new stored procedure"
              className="h-7 px-3 text-xs"
            >
              <Plus className="h-3 w-3 mr-1.5" />
              New
            </Button>
          </div>
        </div>

        {/* Procedure List */}
        <div className="flex-1 overflow-y-auto">
          {procedures && procedures.length > 0 ? (
            <div className="py-1">
              {procedures.map((procedure) => (
                <div
                  key={procedure.id}
                  className={`group flex items-center gap-2 px-3 py-2 cursor-pointer transition-all duration-150 hover:bg-muted/40 focus:outline-none focus:bg-muted/60 ${
                    selectedProcedureId === procedure.id
                      ? 'bg-primary/10 border-l-2 border-primary'
                      : 'border-l-2 border-transparent hover:border-l-muted-foreground/20'
                  }`}
                  onClick={() => onSelectProcedure(procedure.id)}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selectedProcedureId === procedure.id}
                  aria-label={`Select procedure ${procedure.name}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectProcedure(procedure.id);
                    }
                  }}
                >
                  <Database className="h-4 w-4 text-muted-foreground flex-shrink-0 group-hover:text-foreground transition-colors" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-foreground truncate pr-1">{procedure.name}</p>
                      <Badge
                        variant={
                          procedure.status === 'published'
                            ? 'default'
                            : 'secondary'
                        }
                        className="text-[10px] px-1.5 py-0.5 h-4 font-medium"
                      >
                        {procedure.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-tight">
                      {procedure.publishedAt
                        ? `Published ${formatDistanceToNow(
                            new Date(procedure.publishedAt),
                            { addSuffix: true }
                          )}`
                        : `Created ${formatDistanceToNow(
                            new Date(procedure.createdAt),
                            { addSuffix: true }
                          )}`}
                    </p>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Actions for procedure ${procedure.name}`}
                        aria-expanded={false}
                      >
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      side="bottom"
                      className="min-w-[140px]"
                      aria-label={`Procedure actions for ${procedure.name}`}
                    >
                      {procedure.status === 'draft' && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onPublishProcedure(procedure.id);
                          }}
                        >
                          <Upload className="h-3.5 w-3.5 mr-2" />
                          <span className="text-sm">Publish</span>
                        </DropdownMenuItem>
                      )}

                      {procedure.status === 'published' && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onExecuteProcedure(procedure.id);
                          }}
                        >
                          <Play className="h-3.5 w-3.5 mr-2" />
                          <span className="text-sm">Execute</span>
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive focus:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(procedure.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        <span className="text-sm">Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Database className="h-8 w-8 mb-3 text-muted-foreground/40" />
              <p className="text-sm font-medium text-foreground mb-1">No procedures yet</p>
              <p className="text-xs text-muted-foreground mb-4">
                Create your first stored procedure to get started
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={onCreateProcedure}
                className="h-8 px-4 text-xs"
              >
                <Plus className="h-3 w-3 mr-1.5" />
                Create Procedure
              </Button>
            </div>
          )}
        </div>
      </div>

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
              className="bg-destructive text-white hover:bg-destructive/90 focus:ring-destructive"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
