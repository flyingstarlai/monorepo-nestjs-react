import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api';
import type { User } from '../types';
import { useAuth } from './use-auth';

export function useLogoutMutation() {
  const { logout } = useAuth();

  return useMutation({
    mutationFn: async () => {
      logout();
    },
  });
}

export function useAvatarUploadMutation() {
  const { updateUser } = useAuth();

  return useMutation({
    mutationFn: (file: File) => authApi.uploadAvatar(file),
    onSuccess: (updatedUser: User) => {
      updateUser(updatedUser);
    },
  });
}

export function useProfileUpdateMutation() {
  const { updateUser } = useAuth();

  return useMutation({
    mutationFn: (profileData: { name?: string; username?: string }) =>
      authApi.updateProfile(profileData),
    onSuccess: (updatedUser: User) => {
      updateUser(updatedUser);
    },
  });
}
