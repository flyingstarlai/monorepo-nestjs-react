import { createFileRoute } from '@tanstack/react-router';
import { Key } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChangePasswordForm } from '@/features/auth/components/change-password-form';

export const Route = createFileRoute('/_dashboard/settings/security')({
  component: SecuritySettings,
});

function SecuritySettings() {
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Security</h1>
          <p className="mt-2 text-muted-foreground">Manage your password and API access settings</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Password Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Password
            </CardTitle>
            <CardDescription>Change your password to keep your account secure</CardDescription>
          </CardHeader>
          <CardContent>
            {isChangingPassword ? (
              <ChangePasswordForm
                onSuccess={() => setIsChangingPassword(false)}
                onCancel={() => setIsChangingPassword(false)}
              />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">Last changed</h3>
                    <p className="text-sm text-muted-foreground">3 months ago</p>
                  </div>
                  <Button variant="outline" onClick={() => setIsChangingPassword(true)}>
                    Change Password
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* API Keys */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Keys
            </CardTitle>
            <CardDescription>Manage your API access tokens</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Active Keys</h3>
                  <p className="text-sm text-muted-foreground">0 active keys</p>
                </div>
                <Button variant="outline">Manage Keys</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
