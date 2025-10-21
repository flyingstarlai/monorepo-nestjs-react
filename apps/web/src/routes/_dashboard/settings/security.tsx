import { createFileRoute } from '@tanstack/react-router';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Lock, Smartphone, Key } from 'lucide-react';

export const Route = createFileRoute('/_dashboard/settings/security')({
  component: SecuritySettings,
});

function SecuritySettings() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Security</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your password and authentication settings
          </p>
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
            <CardDescription>
              Change your password to keep your account secure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Last changed</h3>
                  <p className="text-sm text-muted-foreground">3 months ago</p>
                </div>
                <Button variant="outline">Change Password</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Two-Factor Authentication */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Two-Factor Authentication
            </CardTitle>
            <CardDescription>
              Add an extra layer of security to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">2FA Status</h3>
                  <p className="text-sm text-muted-foreground">Not enabled</p>
                </div>
                <Button>Enable 2FA</Button>
              </div>
            </div>
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
