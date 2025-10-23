import { Calendar, Mail, Shield, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge.tsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import { useAuth } from '../hooks';

export function UserInfo() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          User Profile
        </CardTitle>
        <CardDescription>Your account information and details</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src="" />
            <AvatarFallback className="text-lg font-semibold bg-primary text-primary-foreground">
              {user.name?.charAt(0)?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{user.name}</h3>
              <p className="text-muted-foreground">@{user.username}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Role:</span>
                </div>
                <Badge
                  variant="secondary"
                  className={
                    user.role === 'Admin'
                      ? 'bg-purple-100 text-purple-800 border-purple-200'
                      : 'bg-blue-100 text-blue-800 border-blue-200'
                  }
                >
                  {user.role}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Email:</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {user.email || 'No email provided'}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">User ID:</span>
                </div>
                <p className="text-sm font-mono text-muted-foreground">
                  {user.id}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Member Since:</span>
                </div>
                <p className="text-sm text-muted-foreground">Today</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
