import { createFileRoute } from '@tanstack/react-router';
import { Upload } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/features/auth';
import { AuthError } from '@/features/auth/api';
import {
  useAvatarUploadMutation,
  useProfileUpdateMutation,
} from '@/features/auth/hooks/use-auth-mutation';

export const Route = createFileRoute('/_dashboard/settings/profile')({
  component: ProfileSettings,
});

function ProfileSettings() {
  const { user } = useAuth();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user?.avatar || null
  );
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameId = useId();
  const usernameId = useId();

  const avatarUploadMutation = useAvatarUploadMutation();
  const profileUpdateMutation = useProfileUpdateMutation();

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    // Check file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('File size must be less than 2MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setUploadError('File must be an image');
      return;
    }

    setUploadError(null);

    try {
      // Upload to API using mutation
      await avatarUploadMutation.mutateAsync(file);
      setAvatarPreview(user?.avatar || null);
      setSaveMessage('Avatar updated successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      if (error instanceof AuthError) {
        setUploadError(error.message);
      } else {
        setUploadError('Failed to upload avatar');
      }
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleSaveProfile = async () => {
    const nameInput = document.getElementById(nameId) as HTMLInputElement;

    const profileData = {
      name: nameInput?.value || user?.name,
    };

    setSaveMessage(null);

    try {
      await profileUpdateMutation.mutateAsync(profileData);
      setSaveMessage('Profile updated successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      if (error instanceof AuthError) {
        setUploadError(error.message);
      } else {
        setUploadError('Failed to update profile');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your profile information and account details.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Avatar Upload Section */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Avatar
            </CardTitle>
            <CardDescription>
              Upload a profile picture. Maximum file size is 2MB.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage
                  src={avatarPreview || undefined}
                  alt={user?.name}
                />
                <AvatarFallback className="text-lg">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <Button
                  onClick={handleAvatarClick}
                  variant="outline"
                  disabled={avatarUploadMutation.isPending}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {avatarUploadMutation.isPending
                    ? 'Uploading...'
                    : 'Change Avatar'}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                {uploadError && (
                  <p className="text-sm text-destructive">{uploadError}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Information Section */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor={nameId}>Name</Label>
                <Input id={nameId} defaultValue={user?.name || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor={usernameId}>Username</Label>
                <Input
                  id={usernameId}
                  defaultValue={user?.username || ''}
                  readOnly
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              {saveMessage && (
                <span className="text-sm text-green-600 py-2">
                  {saveMessage}
                </span>
              )}
              <Button
                onClick={handleSaveProfile}
                disabled={profileUpdateMutation.isPending}
              >
                {profileUpdateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
