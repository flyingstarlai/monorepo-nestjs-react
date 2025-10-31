import { Button } from '@/components/ui/button';

interface ConsoleMessage {
  timestamp: Date;
  type: 'info' | 'success' | 'error';
  message: string;
}

interface ConsolePanelProps {
  consoleMessages: ConsoleMessage[];
  setConsoleMessages: React.Dispatch<React.SetStateAction<ConsoleMessage[]>>;
}

export function ConsolePanel({ consoleMessages, setConsoleMessages }: ConsolePanelProps) {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium">Console Messages</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setConsoleMessages([])}
          disabled={consoleMessages.length === 0}
          aria-label="Clear all console messages"
        >
          Clear
        </Button>
      </div>

      {consoleMessages.length > 0 ? (
        <div className="space-y-2">
          {consoleMessages.map((msg, index) => (
            <div
              key={index}
              className={`p-3 rounded-md border ${
                msg.type === 'error'
                  ? 'bg-destructive/10 border-destructive/20 text-destructive'
                  : msg.type === 'success'
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm flex-1">{msg.message}</p>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {msg.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No console messages. Procedure execution status and
          results will appear here.
        </p>
      )}
    </div>
  );
}