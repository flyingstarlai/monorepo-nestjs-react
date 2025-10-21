import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./features/auth";
import * as TanStackQueryProvider from "./integrations/tanstack-query/root-provider.tsx";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

import "./styles.css";
import reportWebVitals from "./reportWebVitals.ts";

// Create a new router instance with authentication context
const TanStackQueryProviderContext = TanStackQueryProvider.getContext();

// Create a router that will get its auth context from the AuthProvider
function useRouterWithAuth() {
	const auth = useAuth();

	return createRouter({
		routeTree,
		context: {
			...TanStackQueryProviderContext,
			auth,
		},
		defaultPreload: "intent",
		scrollRestoration: true,
		defaultStructuralSharing: true,
		defaultPreloadStaleTime: 0,
	});
}

// Register the router instance for type safety
declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof useRouterWithAuth>;
	}
}

// Router component that uses the auth context
function RouterWithAuth() {
	const router = useRouterWithAuth();
	return <RouterProvider router={router} />;
}

// Wrapper component to provide auth context to router
function AppWithProviders() {
	return (
		<AuthProvider>
			<TanStackQueryProvider.Provider {...TanStackQueryProviderContext}>
				<RouterWithAuth />
				<Toaster />
			</TanStackQueryProvider.Provider>
		</AuthProvider>
	);
}

// Render the app
const rootElement = document.getElementById("app");
if (rootElement && !rootElement.innerHTML) {
	const root = ReactDOM.createRoot(rootElement);
	root.render(
		<StrictMode>
			<AppWithProviders />
		</StrictMode>,
	);
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
