import { createFileRoute } from "@tanstack/react-router";
import { CreditCard, History, Plus, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/_dashboard/settings/billing")({
	component: BillingSettings,
});

function BillingSettings() {
	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Billing</h1>
					<p className="mt-2 text-muted-foreground">
						Manage your subscription and billing information.
					</p>
				</div>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				{/* Current Plan */}
				<Card className="w-full">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Star className="h-5 w-5" />
							Current Plan
						</CardTitle>
						<CardDescription>Your current subscription plan</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex items-center justify-between">
							<div>
								<h3 className="text-lg font-medium">Free Plan</h3>
								<p className="text-sm text-muted-foreground">
									Perfect for getting started
								</p>
							</div>
							<Badge
								variant="secondary"
								className="bg-green-500 hover:bg-green-600 text-white border-green-500"
							>
								Active
							</Badge>
						</div>
					</CardContent>
				</Card>

				{/* Payment Method */}
				<Card className="w-full">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<CreditCard className="h-5 w-5" />
							Payment Method
						</CardTitle>
						<CardDescription>
							Add or update your payment methods.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="text-center py-8">
							<p className="text-muted-foreground mb-4">
								No payment methods on file
							</p>
							<Button>
								<Plus className="mr-2 h-4 w-4" />
								Add Payment Method
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Billing History */}
			<Card className="w-full">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<History className="h-5 w-5" />
						Billing History
					</CardTitle>
					<CardDescription>
						View your past invoices and payments.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="text-center py-8">
						<p className="text-muted-foreground">
							No billing history available
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
