'use client';

// Deprecated: Former react-hook-form wrappers. We now standardize on TanStack React Form.
// This file remains as a lightweight UI wrapper to avoid breaking imports.

import { Slot } from '@radix-ui/react-slot';
import * as React from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// Pass-through container
function Form({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn(className)} {...props} />;
}

// Simple item container
function FormItem({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="form-item"
      className={cn('grid gap-2', className)}
      {...props}
    />
  );
}

function FormLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  return <Label data-slot="form-label" className={cn(className)} {...props} />;
}

function FormControl({ ...props }: React.ComponentProps<typeof Slot>) {
  return <Slot data-slot="form-control" {...props} />;
}

function FormDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="form-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
}

function FormMessage({
  className,
  children,
  ...props
}: React.ComponentProps<'p'>) {
  if (!children) return null;
  return (
    <p
      data-slot="form-message"
      className={cn('text-destructive text-sm', className)}
      {...props}
    >
      {children}
    </p>
  );
}

// Kept for compatibility; no-op in TanStack Form world
function FormField(props: { children?: React.ReactNode }) {
  return <>{props.children}</>;
}

// Export a no-op hook for compatibility
function useFormField() {
  return {
    id: '',
    name: '',
    formItemId: '',
    formDescriptionId: '',
    formMessageId: '',
    error: null as any,
  };
}

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
};
