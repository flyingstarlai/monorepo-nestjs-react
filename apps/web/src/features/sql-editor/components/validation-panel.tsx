interface ValidationMessage {
  timestamp: Date;
  type: 'error' | 'warning';
  message: string;
}

interface ValidationPanelProps {
  validationMessages: ValidationMessage[];
}

export function ValidationPanel({ validationMessages }: ValidationPanelProps) {
  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <p className="text-sm font-medium">Validation Messages</p>
      </div>

      {validationMessages.length > 0 ? (
        <div className="flex-1 min-h-0 overflow-auto space-y-2">
          {validationMessages.map((msg, index) => (
            <div
              key={index}
              className={`p-3 rounded-md border ${
                msg.type === 'error'
                  ? 'bg-destructive/10 border-destructive/20 text-destructive'
                  : 'bg-yellow-50 border-yellow-200 text-yellow-800'
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
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground text-center">
            No validation messages. SQL syntax errors and warnings will appear
            here.
          </p>
        </div>
      )}
    </div>
  );
}
