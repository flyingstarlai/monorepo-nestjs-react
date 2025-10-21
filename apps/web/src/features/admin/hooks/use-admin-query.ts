import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../api";

export function useUsersQuery() {
	return useQuery({
		queryKey: ["admin", "users"],
		queryFn: adminApi.listUsers,
		staleTime: 1000 * 60 * 5, // 5 minutes
	});
}

export function useRolesQuery() {
	return useQuery({
		queryKey: ["admin", "roles"],
		queryFn: adminApi.listRoles,
		staleTime: 1000 * 60 * 30, // 30 minutes
	});
}
