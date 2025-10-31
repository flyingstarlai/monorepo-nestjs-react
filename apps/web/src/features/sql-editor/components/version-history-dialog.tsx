import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { History, GitCompare, RotateCcw, User, Eye, Check } from 'lucide-react';
import { DiffEditor, Editor } from '@monaco-editor/react';
import { useVersions, useRollbackToVersion, usePublishProcedure } from '../hooks/use-sql-editor';
import type { StoredProcedureVersion, StoredProcedure } from '../types';

interface VersionHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceSlug: string;
  procedure: StoredProcedure | null;
  onSuccess?: () => void;
}

export function VersionHistoryDialog({
  open,
  onOpenChange,
  workspaceSlug,
  procedure,
  onSuccess,
}: VersionHistoryDialogProps) {
  const [selectedVersions, setSelectedVersions] = useState<{
    left: StoredProcedureVersion | null;
    right: StoredProcedureVersion | null;
  }>({ left: null, right: null });

  // Clear UX separation between View and Compare modes
  const [mode, setMode] = useState<'view' | 'compare'>('view');



  // Validate procedure before making API calls
  const isValidProcedure = procedure && procedure.id && procedure.id !== '' && procedure.id !== 'undefined';
  const procedureIdForQuery = isValidProcedure ? procedure.id : '';

  const { data: versions, isLoading } = useVersions(workspaceSlug, procedureIdForQuery);
  const rollbackMutation = useRollbackToVersion(workspaceSlug, procedureIdForQuery);
  const publishMutation = usePublishProcedure(workspaceSlug, procedureIdForQuery);

  // Reset selected versions when procedure changes
  useEffect(() => {
    setSelectedVersions({ left: null, right: null });
  }, [procedure?.id]);

  // Reset selection when switching modes to avoid confusion
  useEffect(() => {
    setSelectedVersions({ left: null, right: null });
  }, [mode]);

  // Auto-select current version in View mode
  useEffect(() => {
    if (!open) return;
    if (mode !== 'view') return;
    if (!versions || versions.length === 0) return;
    if (selectedVersions.left) return; // do not override user selection

    const currentVersionNumber = Math.max(...versions.map((v) => v.version));
    const current = versions.find((v) => v.version === currentVersionNumber) || versions[0];
    setSelectedVersions({ left: current, right: null });
  }, [open, mode, versions, selectedVersions.left]);



  const handleVersionSelect = (version: StoredProcedureVersion) => {
    if (mode === 'view') {
      setSelectedVersions({ left: version, right: null });
      return;
    }

    // Compare mode selection logic (choose up to 2, toggle if clicked again)
    const isLeft = selectedVersions.left?.id === version.id;
    const isRight = selectedVersions.right?.id === version.id;

    if (isLeft) {
      setSelectedVersions({ left: null, right: selectedVersions.right });
      return;
    }
    if (isRight) {
      setSelectedVersions({ left: selectedVersions.left, right: null });
      return;
    }

    if (!selectedVersions.left) {
      setSelectedVersions({ left: version, right: null });
    } else if (!selectedVersions.right) {
      setSelectedVersions({ left: selectedVersions.left, right: version });
    } else {
      // Replace the older (left) with the new selection
      setSelectedVersions({ left: version, right: selectedVersions.right });
    }
  };



  // Rollback confirmation state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rollbackTarget, setRollbackTarget] = useState<StoredProcedureVersion | null>(null);

  const openRollbackConfirm = (version: StoredProcedureVersion) => {
    setRollbackTarget(version);
    setConfirmOpen(true);
  };

  const confirmRollback = async () => {
    if (!rollbackTarget) return;
    try {
      await rollbackMutation.mutateAsync(rollbackTarget.version);
      onSuccess?.();
      onOpenChange(false);
    } finally {
      setConfirmOpen(false);
      setRollbackTarget(null);
    }
  };

  const confirmRollbackAndPublish = async () => {
    if (!rollbackTarget) return;
    try {
      await rollbackMutation.mutateAsync(rollbackTarget.version);
      await publishMutation.mutateAsync();
      onSuccess?.();
      onOpenChange(false);
    } finally {
      setConfirmOpen(false);
      setRollbackTarget(null);
    }
  };

  const cancelRollback = () => {
    setConfirmOpen(false);
    setRollbackTarget(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Early return for invalid procedure state
  if (!isValidProcedure) {
    
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Version History Error
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Unable to load version history. Please select a valid procedure first.
            </p>
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Version History: {procedure?.name || 'Unknown Procedure'}
                {versions && versions.length > 0 && (
                  <span className="ml-2 text-sm text-muted-foreground">Current: v{Math.max(...versions.map(v => v.version))}</span>
                )}
              </div>
              {/* Mode toggle */}
              <div className="flex items-center gap-2">
                <Button
                  variant={mode === 'view' ? 'default' : 'outline'}
                  size="sm"
                  className={mode === 'view' ? 'bg-primary text-white' : ''}
                  onClick={() => setMode('view')}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button
                  variant={mode === 'compare' ? 'default' : 'outline'}
                  size="sm"
                  className={mode === 'compare' ? 'bg-primary text-white' : ''}
                  onClick={() => setMode('compare')}
                >
                  <GitCompare className="h-4 w-4 mr-1" />
                  Compare
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

        <div className="flex-1 flex min-h-0">
          {/* Version List */}
          <div className="w-1/3 border-r flex flex-col">
            <div className="p-4 border-b">
              <h3 className="font-medium">Versions</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {mode === 'compare' ? 'Select two versions to compare' : 'Select a version to view or rollback'}
              </p>
            </div>

            
            <ScrollArea className="flex-1 p-4">
              {isLoading ? (
                <div className="text-center py-8">Loading versions...</div>
              ) : versions && versions.length > 0 ? (
                <div className="space-y-2">
                  {versions.map((version) => {
                    const currentVersion = Math.max(...versions.map(v => v.version));
                    const isCurrent = version.version === currentVersion;
                    const isSelected = selectedVersions.left?.id === version.id || selectedVersions.right?.id === version.id;
                    return (
                      <div
                        key={version.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                          isSelected ? 'ring-2 ring-primary/20 bg-primary/5' : ''
                        }`}
                        onClick={() => handleVersionSelect(version)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">v{version.version}</span>
                            {isCurrent && (
                              <Badge variant="secondary" className="text-xs">Current</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {mode === 'compare' && isSelected && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span className="truncate">
                            {version.creator?.name || version.creator?.email || 'Unknown'}
                          </span>
                          <span className="opacity-50">•</span>
                          <span>{formatDate(version.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No versions found
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col">
            {mode === 'compare' ? (
              selectedVersions.left && selectedVersions.right ? (
                <div className="flex-1 flex flex-col">
                  <div className="p-4 border-b flex items-center gap-2">
                    <GitCompare className="h-4 w-4" />
                    <span className="font-medium">
                      Comparing v{selectedVersions.left.version} → v{selectedVersions.right.version}
                    </span>
                  </div>
                  <div className="flex-1">
                    <DiffEditor
                      height="100%"
                      language="sql"
                      original={selectedVersions.left.sqlText}
                      modified={selectedVersions.right.sqlText}
                      theme="vs-light"
                      options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        wordWrap: 'on',
                      }}
                      onMount={() => {
                        // Configure diff editor
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <GitCompare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">Select two versions to compare</p>
                    <p className="text-sm mt-2">
                      {selectedVersions.left || selectedVersions.right
                        ? 'Select one more version from the list'
                        : 'Click any two versions in the list'}
                    </p>
                  </div>
                </div>
              )
            ) : (
              selectedVersions.left ? (
                <div className="flex-1 flex flex-col">
                  <div className="p-4 border-b flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <span className="font-medium">Viewing v{selectedVersions.left.version}</span>
                  </div>
                  <div className="flex-1">
                    <Editor
                      height="100%"
                      language="sql"
                      value={selectedVersions.left.sqlText}
                      theme="vs-light"
                      options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        wordWrap: 'on',
                        renderWhitespace: 'all',
                      }}
                      onMount={() => {
                        // Configure single view editor
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">Select a version to view</p>
                    <p className="text-sm mt-2">Click a version in the list</p>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

          {/* Actions */}
          <Separator />
          <div className="p-4 flex justify-between">
            <div className="text-sm text-muted-foreground">
              {mode === 'compare'
                ? selectedVersions.left && selectedVersions.right
                  ? `Comparing v${selectedVersions.left.version} → v${selectedVersions.right.version}`
                  : selectedVersions.left || selectedVersions.right
                    ? 'Select one more version for comparison'
                    : 'Select two versions to compare'
                : selectedVersions.left
                  ? `Viewing v${selectedVersions.left.version}`
                  : 'Select a version to view'}
            </div>
            
            <div className="flex gap-2">
              {mode === 'view' && selectedVersions.left && !selectedVersions.right && (() => {
                const isDisabled = rollbackMutation.isPending || (versions && selectedVersions.left.version === Math.max(...versions.map(v => v.version)));
                return (
                  <Button
                    variant="outline"
                    onClick={() => !isDisabled && openRollbackConfirm(selectedVersions.left!)}
                    disabled={isDisabled}
                    title={versions && selectedVersions.left.version === Math.max(...versions.map(v => v.version)) ? 'Already at current version' : undefined}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    {versions && selectedVersions.left.version === Math.max(...versions.map(v => v.version))
                      ? 'Already Current'
                      : `Rollback to v${selectedVersions.left.version}`}
                  </Button>
                );
              })()}
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
      {/* Rollback Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={(open) => !open && cancelRollback()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Confirm Rollback
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              This will set the Draft to the SQL from the selected version. The Published procedure remains unchanged until you publish again.
            </p>
            <p className="text-xs text-muted-foreground">
              Tip: Use “Rollback & Publish” to deploy the selected version immediately.
            </p>
            {rollbackTarget && (
              <div className="text-sm rounded-md border p-3 bg-muted/30">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">Version v{rollbackTarget.version}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>{rollbackTarget.creator?.name || rollbackTarget.creator?.email || 'Unknown'}</span>
                  <span className="opacity-50">•</span>
                  <span>{formatDate(rollbackTarget.createdAt)}</span>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={cancelRollback} disabled={rollbackMutation.isPending || publishMutation.isPending}>Cancel</Button>
            <Button variant="secondary" onClick={confirmRollback} disabled={rollbackMutation.isPending || publishMutation.isPending}>
              {rollbackMutation.isPending ? 'Rolling back...' : 'Rollback Only'}
            </Button>
            <Button onClick={confirmRollbackAndPublish} disabled={rollbackMutation.isPending || publishMutation.isPending}>
              {rollbackMutation.isPending || publishMutation.isPending ? 'Processing...' : 'Rollback & Publish'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </DialogContent>
    </Dialog>
  );
}