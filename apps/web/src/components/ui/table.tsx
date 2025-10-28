import * as React from 'react';

import { cn } from '@/lib/utils';

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto rounded-lg border bg-background">
    <table
      ref={ref}
      className={cn(
        'w-full caption-bottom text-sm',
        'border-separate border-spacing-0',
        className
      )}
      {...props}
    />
  </div>
));
Table.displayName = 'Table';

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead 
    ref={ref} 
    className={cn(
      '[&_tr]:border-b',
      '[&_th]:bg-muted/30',
      '[&_th]:font-semibold',
      '[&_th]:text-foreground',
      '[&_th]:h-12',
      '[&_th]:px-4',
      '[&_th]:text-left',
      '[&_th]:align-middle',
      '[&_th:first-child]:rounded-tl-lg',
      '[&_th:last-child]:rounded-tr-lg',
      className
    )} 
    {...props} 
  />
));
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn(
      '[&_tr:last-child]:border-0',
      '[&_tr]:transition-colors',
      '[&_tr]:hover:bg-muted/20',
      '[&_tr]:data-[state=selected]:bg-muted/40',
      '[&_td]:p-4',
      '[&_td]:align-middle',
      '[&_td]:border-b',
      '[&_tr:last-child_&td]:border-b-0',
      '[&_tr:last-child_&td:first-child]:rounded-bl-lg',
      '[&_tr:last-child_&td:last-child]:rounded-br-lg',
      className
    )}
    {...props}
  />
));
TableBody.displayName = 'TableBody';

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      'border-t bg-muted/50 font-medium [&>tr]:last:border-b-0',
      '[&_tr]:bg-muted/20',
      '[&_td]:font-medium',
      '[&_td]:text-foreground',
      '[&_td]:py-3',
      '[&_td]:px-4',
      className
    )}
    {...props}
  />
));
TableFooter.displayName = 'TableFooter';

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      'border-b border-border/50 transition-colors duration-150',
      'hover:bg-muted/20 data-[state=selected]:bg-muted/40',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
      className
    )}
    {...props}
  />
));
TableRow.displayName = 'TableRow';

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      'h-12 px-4 text-left align-middle font-semibold text-foreground bg-muted/30',
      'border-b border-border/50',
      'first:rounded-tl-lg last:rounded-tr-lg',
      '[&:has([role=checkbox])]:pr-0',
      className
    )}
    {...props}
  />
));
TableHead.displayName = 'TableHead';

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      'p-4 align-middle border-b border-border/30',
      'first:rounded-bl-lg last:rounded-br-lg',
      '[&:has([role=checkbox])]:pr-0',
      className
    )}
    {...props}
  />
));
TableCell.displayName = 'TableCell';

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn('mt-4 text-sm text-muted-foreground px-4 py-2', className)}
    {...props}
  />
));
TableCaption.displayName = 'TableCaption';

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
