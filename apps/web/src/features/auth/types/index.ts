export interface User {
	id: string;
	username: string;
	name: string;
	role: string;
	avatar?: string;
	isActive: boolean;
	createdAt?: string;
	updatedAt?: string;
}

export interface LoginCredentials {
	username: string;
	password: string;
}

export interface AuthResponse {
	access_token: string;
	user: User;
}

export interface AuthContextType {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	login: (credentials: LoginCredentials) => Promise<void>;
	logout: () => void;
	updateUser: (user: User) => void;
}

export interface AuthState {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
}
