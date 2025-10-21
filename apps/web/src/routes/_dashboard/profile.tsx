import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboard/profile")({
	beforeLoad: async () => {
		throw redirect({
			to: "/settings/profile",
		});
	},
});
