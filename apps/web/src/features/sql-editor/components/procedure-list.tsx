import { useState, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  FileCode,
  Trash2,
  MoreHorizontal,
  Plus,
  CheckCircle,
  List,
  FileText,
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

type FilterType = 'all' | 'published' | 'draft';

interface ProcedureListProps {
  procedures: StoredProcedure[] | undefined;
  selectedProcedureId: string | null;
  onSelectProcedure: (id: string) => void;
  onCreateProcedure: () => void;
  onDeleteProcedure: (id: string) => void;
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
}: ProcedureListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [procedureToDelete, setProcedureToDelete] = useState<string | null>(
    null
  );
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // Filter procedures based on selected filter
  const filteredProcedures = useMemo(() => {
    if (!procedures) return procedures;

    switch (activeFilter) {
      case 'published':
        return procedures.filter((p) => p.status === 'published');
      case 'draft':
        return procedures.filter((p) => p.status === 'draft');
      default:
        return procedures;
    }
  }, [procedures, activeFilter]);

  // Get counts for display
  const publishedCount =
    procedures?.filter((p) => p.status === 'published').length || 0;
  const draftCount =
    procedures?.filter((p) => p.status === 'draft').length || 0;

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
              <h2 className="text-sm font-semibold text-foreground">
                Procedures
              </h2>
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
        <div className="flex-1 overflow-hidden py-1">
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
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Procedures
              </h2>
              <p className="text-xs text-muted-foreground">
                {filteredProcedures?.length || 0} of {procedures?.length || 0}{' '}
                {procedures?.length === 1 ? 'procedure' : 'procedures'}
                {activeFilter !== 'all' && ` (${activeFilter})`}
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

          {/* Filter Buttons */}
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant={activeFilter === 'all' ? 'default' : 'ghost'}
              onClick={() => setActiveFilter('all')}
              aria-label="Show all procedures"
              aria-pressed={activeFilter === 'all'}
              className="h-7 px-2 text-xs font-medium transition-all duration-200"
            >
              <List className="h-3 w-3 mr-1.5" />
              All
              <span className="ml-1 text-[10px] opacity-70">
                {procedures?.length || 0}
              </span>
            </Button>
            <Button
              size="sm"
              variant={activeFilter === 'published' ? 'default' : 'ghost'}
              onClick={() => setActiveFilter('published')}
              aria-label="Show published procedures"
              aria-pressed={activeFilter === 'published'}
              className="h-7 px-2 text-xs font-medium transition-all duration-200"
            >
              <CheckCircle className="h-3 w-3 mr-1.5" />
              Published
              <span className="ml-1 text-[10px] opacity-70">
                {publishedCount}
              </span>
            </Button>
            <Button
              size="sm"
              variant={activeFilter === 'draft' ? 'default' : 'ghost'}
              onClick={() => setActiveFilter('draft')}
              aria-label="Show draft procedures"
              aria-pressed={activeFilter === 'draft'}
              className="h-7 px-2 text-xs font-medium transition-all duration-200"
            >
              <FileText className="h-3 w-3 mr-1.5" />
              Draft
              <span className="ml-1 text-[10px] opacity-70">{draftCount}</span>
            </Button>
          </div>
        </div>

        {/* Procedure List */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {filteredProcedures && filteredProcedures.length > 0 ? (
            <div className="py-1">
              {filteredProcedures.map((procedure) => (
                <div
                  key={procedure.id}
                  className={`group flex items-center gap-2 px-3 py-2 cursor-pointer transition-all duration-150 hover:bg-muted/40 focus:outline-none focus:bg-muted/60 ${
                    selectedProcedureId === procedure.id
                      ? 'bg-primary/10 border-l-2 border-primary'
                      : procedure.status === 'draft'
                        ? 'border-l-2 border-green-200 hover:border-l-green-400 bg-green-50/30'
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
                  <FileCode className="h-4 w-4 text-muted-foreground flex-shrink-0 group-hover:text-foreground transition-colors" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-foreground truncate pr-1">
                        {procedure.name}
                      </p>
                      <Badge
                        variant={
                          procedure.status === 'published'
                            ? 'default'
                            : 'secondary'
                        }
                        className={`text-[10px] px-2 py-0.5 h-4 font-medium flex items-center gap-1 transition-all duration-200 ${
                          procedure.status === 'published'
                            ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
                            : ''
                        }`}
                      >
                        {procedure.status === 'published' && (
                          <CheckCircle className="h-2.5 w-2.5" />
                        )}
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
              <FileCode className="h-8 w-8 mb-3 text-muted-foreground/40" />
              <p className="text-sm font-medium text-foreground mb-1">
                {activeFilter === 'all'
                  ? 'No procedures yet'
                  : `No ${activeFilter} procedures`}
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                {activeFilter === 'all'
                  ? 'Create your first stored procedure to get started'
                  : activeFilter === 'published'
                    ? 'No procedures have been published yet'
                    : 'No draft procedures found'}
                {activeFilter !== 'all' &&
                  procedures &&
                  procedures.length > 0 && (
                    <span className="block mt-2">
                      Try selecting a different filter or create a new
                      procedure.
                    </span>
                  )}
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
