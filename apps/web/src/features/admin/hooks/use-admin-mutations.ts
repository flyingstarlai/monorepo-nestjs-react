import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminApi, type CreateUserPayload } from "../api";

export function useCreateUserMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: CreateUserPayload) => adminApi.createUser(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
			toast.success("User created successfully");
		},
		onError: (error) => {
			toast.error(
				error instanceof Error ? error.message : "Failed to create user",
			);
		},
	});
}

export function useSetUserActiveMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
			adminApi.setUserActive(userId, isActive),
		onSuccess: (_, { isActive }) => {
			queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
			toast.success(`User ${isActive ? "enabled" : "disabled"} successfully`);
		},
		onError: (error) => {
			toast.error(
				error instanceof Error ? error.message : "Failed to update user status",
			);
		},
	});
}

export function useSetUserRoleMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			userId,
			roleName,
		}: {
			userId: string;
			roleName: "Admin" | "User";
		}) => adminApi.setUserRole(userId, roleName),
		onSuccess: (_, { roleName }) => {
			queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
			toast.success(`User role changed to ${roleName}`);
		},
		onError: (error) => {
			toast.error(
				error instanceof Error ? error.message : "Failed to update user role",
			);
		},
	});
}
