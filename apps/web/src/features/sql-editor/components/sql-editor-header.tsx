import { Button } from '@/components/ui/button';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Database, FolderTree, LucidePanelLeft, Maximize2, Minimize2 } from 'lucide-react';

interface SQLEditorHeaderProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  explorerCollapsed: boolean;
  onToggleExplorer: () => void;
  bottomPanelOpen: boolean;
  onToggleBottomPanel: () => void;
}

export function SQLEditorHeader({
  open,
  setOpen,
  explorerCollapsed,
  onToggleExplorer,
  bottomPanelOpen,
  onToggleBottomPanel,
}: SQLEditorHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b bg-background flex-shrink-0">
      <div className="flex items-center gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(!open)}
              aria-label={open ? 'Hide sidebar' : 'Show sidebar'}
            >
              <LucidePanelLeft className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle Sidebar</TooltipContent>
        </Tooltip>
        <div className="bg-primary/10 p-2 rounded-lg">
          <Database className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">SQL Tools</h1>
          <p className="text-sm text-muted-foreground">
            Manage and execute stored procedures
          </p>
        </div>
      </div>
      <TooltipProvider>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleExplorer}
                aria-label={
                  explorerCollapsed
                    ? 'Show procedure explorer'
                    : 'Hide procedure explorer'
                }
              >
                {explorerCollapsed ? (
                  <FolderTree className="h-4 w-4" />
                ) : (
                  <FolderTree className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle Explorer</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleBottomPanel}
                aria-label={
                  !bottomPanelOpen ? 'Show bottom panel' : 'Hide bottom panel'
                }
              >
                {!bottomPanelOpen ? (
                  <Maximize2 className="h-4 w-4" />
                ) : (
                  <Minimize2 className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle Panel</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  );
}