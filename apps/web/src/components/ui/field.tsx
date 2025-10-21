"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

const Field = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement> & {
		"data-invalid"?: boolean;
		orientation?: "vertical" | "horizontal" | "responsive";
	}
>(
	(
		{
			className,
			"data-invalid": dataInvalid,
			orientation = "vertical",
			...props
		},
		ref,
	) => (
		<div
			ref={ref}
			className={cn(
				"grid gap-2",
				orientation === "horizontal" &&
					"grid-flow-col auto-cols-max items-center justify-between",
				orientation === "responsive" &&
					"grid-cols-1 sm:grid-flow-col sm:auto-cols-max sm:items-center sm:justify-between",
				dataInvalid && "text-destructive",
				className,
			)}
			data-invalid={dataInvalid}
			{...props}
		/>
	),
);
Field.displayName = "Field";

const FieldGroup = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div ref={ref} className={cn("grid gap-4", className)} {...props} />
));
FieldGroup.displayName = "FieldGroup";

const FieldLabel = React.forwardRef<
	React.ElementRef<typeof Label>,
	React.ComponentPropsWithoutRef<typeof Label>
>(({ className, ...props }, ref) => (
	<Label
		ref={ref}
		className={cn(
			"text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
			className,
		)}
		{...props}
	/>
));
FieldLabel.displayName = "FieldLabel";

const FieldDescription = React.forwardRef<
	HTMLParagraphElement,
	React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
	<p
		ref={ref}
		className={cn("text-sm text-muted-foreground", className)}
		{...props}
	/>
));
FieldDescription.displayName = "FieldDescription";

const FieldError = React.forwardRef<
	HTMLParagraphElement,
	React.HTMLAttributes<HTMLParagraphElement> & {
		errors?: string[];
	}
>(({ className, errors, ...props }, ref) => {
	if (!errors || errors.length === 0) return null;

	return (
		<p
			ref={ref}
			className={cn("text-sm text-destructive", className)}
			{...props}
		>
			{errors[0]}
		</p>
	);
});
FieldError.displayName = "FieldError";

const FieldContent = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div ref={ref} className={cn("space-y-2", className)} {...props} />
));
FieldContent.displayName = "FieldContent";

const FieldSet = React.forwardRef<
	HTMLFieldSetElement,
	React.HTMLAttributes<HTMLFieldSetElement>
>(({ className, ...props }, ref) => (
	<fieldset ref={ref} className={cn("grid gap-4", className)} {...props} />
));
FieldSet.displayName = "FieldSet";

const FieldLegend = React.forwardRef<
	HTMLLegendElement,
	React.HTMLAttributes<HTMLLegendElement> & {
		variant?: "label" | "title";
	}
>(({ className, variant = "label", ...props }, ref) => (
	<legend
		ref={ref}
		className={cn(
			variant === "label" && "text-sm font-medium leading-none",
			variant === "title" && "text-base font-semibold leading-none",
			className,
		)}
		{...props}
	/>
));
FieldLegend.displayName = "FieldLegend";

const FieldTitle = React.forwardRef<
	HTMLHeadingElement,
	React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
	<h4
		ref={ref}
		className={cn("text-sm font-medium leading-none", className)}
		{...props}
	/>
));
FieldTitle.displayName = "FieldTitle";

const FieldSeparator = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div ref={ref} className={cn("my-4 h-px bg-border", className)} {...props} />
));
FieldSeparator.displayName = "FieldSeparator";

export {
	Field,
	FieldGroup,
	FieldLabel,
	FieldDescription,
	FieldError,
	FieldContent,
	FieldSet,
	FieldLegend,
	FieldTitle,
	FieldSeparator,
};
