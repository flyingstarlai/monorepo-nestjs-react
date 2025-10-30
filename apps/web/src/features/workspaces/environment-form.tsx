import { useState, useEffect } from 'react';
import { useForm } from '@tanstack/react-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  Database,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';

import {
  environmentApi,
  type Environment,
} from '@/features/workspaces/environment.api';
import { toast } from 'sonner';

interface EnvironmentFormProps {
  workspaceSlug: string;
  userRole?: string;
}

export function EnvironmentForm({
  workspaceSlug,
  userRole,
}: EnvironmentFormProps) {
  const [environment, setEnvironment] = useState<Environment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    error?: string;
  } | null>(null);
  const [testSuccessful, setTestSuccessful] = useState(false);
  const [testedValues, setTestedValues] = useState<any>(null);
  const [passwordMasked, setPasswordMasked] = useState(true);

  const form = useForm({
    defaultValues: {
      host: '',
      port: 1433,
      username: '',
      password: '',
      database: '',
      connectionTimeout: 30000,
    },
  });

  const canEdit = userRole === 'Owner' || userRole === 'Author';

  // Reset test success when critical form values change for new environments
  useEffect(() => {
    if (testSuccessful && !environment && testedValues) {
      const currentValues = form.state.values;
      
      // Only reset test success if critical connection fields change from what was tested
      const criticalFieldsChanged = 
        currentValues.host !== testedValues.host ||
        currentValues.port !== testedValues.port ||
        currentValues.username !== testedValues.username ||
        currentValues.password !== testedValues.password ||
        currentValues.database !== testedValues.database;
      
      if (criticalFieldsChanged) {
        setTestSuccessful(false);
        setTestedValues(null);
      }
    }
  }, [form.state.values, environment, testSuccessful, testedValues]);

  // Fetch existing environment
  useEffect(() => {
    const fetchEnvironment = async () => {
      try {
        const response = await environmentApi.getEnvironment(workspaceSlug);
        setEnvironment(response.environment);

        if (response.environment) {
          // Reset tested values for existing environments
          setTestedValues(null);
          
          // Populate form with existing data (mask password for security)
          form.setFieldValue('host', response.environment.host);
          form.setFieldValue('port', response.environment.port);
          form.setFieldValue('username', response.environment.username);
          form.setFieldValue('password', '•••••'); // Show masked password for existing environments
          form.setFieldValue('database', response.environment.database);
          form.setFieldValue(
            'connectionTimeout',
            response.environment.connectionTimeout || 30000
          );

          // If environment exists and has a successful connection status, enable the button
          setTestSuccessful(
            response.environment.connectionStatus === 'connected'
          );
        }
      } catch (error) {
        console.error('Failed to fetch environment:', error);
        toast.error('Failed to load environment configuration');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEnvironment();
  }, [workspaceSlug, form]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canEdit) {
      toast.error(
        'You do not have permission to edit environment configuration'
      );
      return;
    }

    await form.validate('submit');
    if (!form.state.isValid) {
      return;
    }

    setIsSaving(true);
    try {
      let data = {
        ...form.state.values,
        encrypt: false, // Always false since we removed SSL option
      };

      // If password is masked, don't send it (keep existing password)
      if (data.password === '•••••') {
        const { password, ...dataWithoutPassword } = data;
        data = dataWithoutPassword as any;
      }
      let response;

      if (environment) {
        // Update existing environment
        response = await environmentApi.updateEnvironment(workspaceSlug, data);
      } else {
        // Create new environment
        response = await environmentApi.createEnvironment(workspaceSlug, data);
      }

      // When creating new environment, set connection status based on successful test
      const updatedEnvironment = {
        ...response.environment,
        connectionStatus: testSuccessful
          ? 'connected'
          : response.environment?.connectionStatus || 'unknown',
      };
      setEnvironment(updatedEnvironment);
      toast.success(
        environment
          ? 'Environment updated successfully'
          : 'Environment created successfully'
      );
    } catch (error) {
      console.error('Failed to save environment:', error);
      toast.error('Failed to save environment configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const testConnection = async () => {
    const formData = {
      ...form.state.values,
      encrypt: false, // Always false since we removed SSL option
    };

    // If password is masked and this is an existing environment, we can't test without the actual password
    if (formData.password === '•••••' && environment) {
      toast.error(
        'Please enter the current password to test the connection, or leave it unchanged to keep using the existing password.'
      );
      setIsTesting(false);
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await environmentApi.testConnection(
        workspaceSlug,
        formData
      );

      setTestResult(response);
      setTestSuccessful(response.success);

      if (response.success) {
        // Store the values that were successfully tested for new environments
        if (!environment) {
          setTestedValues(formData);
        }
        
        toast.success(
          '✅ Connection test successful! Database is reachable and credentials are valid.'
        );

        // Update environment connection status immediately for existing environments
        if (environment) {
          setEnvironment({
            ...environment,
            connectionStatus: 'connected',
            lastTestedAt: new Date().toISOString(),
          });
        }
      } else {
        toast.error(
          `❌ Connection test failed: ${response.error || response.message}`
        );

        // Update environment connection status for failed tests
        if (environment) {
          setEnvironment({
            ...environment,
            connectionStatus: 'failed',
            lastTestedAt: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      setTestResult({
        success: false,
        message: 'Connection test failed',
        error: errorMessage,
      });
      setTestSuccessful(false);
      toast.error(`❌ Connection test failed: ${errorMessage}`);
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Connected
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <AlertCircle className="w-3 h-3 mr-1" />
            Unknown
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Environment Configuration
          </CardTitle>
          <CardDescription>
            MS SQL database connection settings for this workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
              <div className="h-10 bg-muted rounded mb-4"></div>
              <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
              <div className="h-10 bg-muted rounded mb-4"></div>
              <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
              <div className="h-10 bg-muted rounded mb-4"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Environment Configuration
        </CardTitle>
        <CardDescription>
          MS SQL database connection settings for this workspace
        </CardDescription>
      </CardHeader>
      <CardContent>
        {environment && (
          <div className="mb-6 p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Connection Status</h4>
                <p className="text-sm text-muted-foreground">
                  {environment.lastTestedAt && (
                    <>
                      Last tested:{' '}
                      {new Date(environment.lastTestedAt).toLocaleString()}
                    </>
                  )}
                </p>
              </div>
              {getStatusBadge(environment.connectionStatus)}
            </div>
          </div>
        )}

        {testResult && (
          <Alert
            className={`mb-6 ${testResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
          >
            <AlertDescription>
              <div className="flex items-start gap-3">
                {testResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-lg">
                    {testResult.success
                      ? '🎉 Connection Successful!'
                      : '❌ Connection Failed'}
                  </p>
                  <p className="text-sm mt-1">
                    {testResult.success
                      ? 'Successfully connected to the MS SQL database with the provided credentials.'
                      : testResult.message}
                  </p>
                  {testResult.error && (
                    <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-sm text-red-800">
                      <strong>Error Details:</strong> {testResult.error}
                    </div>
                  )}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <form.Field name="host">
              {(field) => (
                <FormItem>
                  <FormLabel>Host</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="localhost or IP address"
                      value={field.state.value as string}
                      onChange={(e) => field.handleChange(e.target.value)}
                      disabled={!canEdit}
                    />
                  </FormControl>
                  {field.state.meta.errors && (
                    <FormMessage>
                      {Array.isArray(field.state.meta.errors)
                        ? field.state.meta.errors.join(', ')
                        : 'Validation error'}
                    </FormMessage>
                  )}
                </FormItem>
              )}
            </form.Field>

            <form.Field name="port">
              {(field) => (
                <FormItem>
                  <FormLabel>Port</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="1433"
                      value={field.state.value as number}
                      onChange={(e) =>
                        field.handleChange(parseInt(e.target.value, 10) || 0)
                      }
                      disabled={!canEdit}
                    />
                  </FormControl>
                  {field.state.meta.errors && (
                    <FormMessage>
                      {Array.isArray(field.state.meta.errors)
                        ? field.state.meta.errors.join(', ')
                        : 'Validation error'}
                    </FormMessage>
                  )}
                </FormItem>
              )}
            </form.Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <form.Field name="username">
              {(field) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Database username"
                      value={field.state.value as string}
                      onChange={(e) => field.handleChange(e.target.value)}
                      disabled={!canEdit}
                    />
                  </FormControl>
                  {field.state.meta.errors && (
                    <FormMessage>
                      {Array.isArray(field.state.meta.errors)
                        ? field.state.meta.errors.join(', ')
                        : 'Validation error'}
                    </FormMessage>
                  )}
                </FormItem>
              )}
            </form.Field>

            <form.Field name="password">
              {(field) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={passwordMasked ? 'password' : 'text'}
                        placeholder={
                          environment
                            ? 'Enter new password or leave unchanged'
                            : 'Database password'
                        }
                        value={field.state.value as string}
                        onChange={(e) => {
                          field.handleChange(e.target.value);
                          // Keep password masked by default when typing
                          // Only unmask when user explicitly clicks the eye icon
                        }}
                        onFocus={() => {
                          // When focusing on masked password, clear it for user to enter new password
                          if (field.state.value === '•••••') {
                            field.handleChange('');
                            // Keep password masked by default
                          }
                        }}
                        disabled={!canEdit}
                      />
                      {field.state.value && (
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          onClick={() => setPasswordMasked(!passwordMasked)}
                        >
                          {passwordMasked ? '👁️' : '🙈'}
                        </button>
                      )}
                    </div>
                  </FormControl>
                  {field.state.value === '•••••' && environment && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Password is saved securely. Click to modify or enter new
                      password.
                    </p>
                  )}
                  {field.state.meta.errors && (
                    <FormMessage>
                      {Array.isArray(field.state.meta.errors)
                        ? field.state.meta.errors.join(', ')
                        : 'Validation error'}
                    </FormMessage>
                  )}
                </FormItem>
              )}
            </form.Field>
          </div>

          <form.Field name="database">
            {(field) => (
              <FormItem>
                <FormLabel>Database Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Database name"
                    value={field.state.value as string}
                    onChange={(e) => field.handleChange(e.target.value)}
                    disabled={!canEdit}
                  />
                </FormControl>
                {field.state.meta.errors && (
                  <FormMessage>
                    {Array.isArray(field.state.meta.errors)
                      ? field.state.meta.errors.join(', ')
                      : 'Validation error'}
                  </FormMessage>
                )}
              </FormItem>
            )}
          </form.Field>

          <form.Field name="connectionTimeout">
            {(field) => (
              <FormItem>
                <FormLabel>Connection Timeout (ms)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="30000"
                    value={field.state.value as number}
                    onChange={(e) =>
                      field.handleChange(parseInt(e.target.value, 10) || 30000)
                    }
                    disabled={!canEdit}
                  />
                </FormControl>
                {field.state.meta.errors && (
                  <FormMessage>
                    {Array.isArray(field.state.meta.errors)
                      ? field.state.meta.errors.join(', ')
                      : 'Validation error'}
                  </FormMessage>
                )}
              </FormItem>
            )}
          </form.Field>

          {canEdit && (
            <div className="space-y-4">
              {!environment && !testSuccessful && (
                <Alert>
                  <AlertDescription>
                    <strong>⚠️ Connection Test Required</strong>
                    <br />
                    Please test the database connection first before creating
                    the environment configuration. This ensures the provided
                    credentials are valid and the database is accessible.
                  </AlertDescription>
                </Alert>
              )}
              {environment && form.getFieldValue('password') === '•••••' && (
                <Alert>
                  <AlertDescription>
                    <strong>💡 Password Saved Securely</strong>
                    <br />
                    Your password is saved securely. To test the connection,
                    please enter the current password in the field above, or
                    leave it unchanged to keep using the existing password.
                  </AlertDescription>
                </Alert>
              )}
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={testConnection}
                  disabled={isTesting}
                  className="min-w-[140px]"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing Connection...
                    </>
                  ) : (
                    <>
                      <Database className="mr-2 h-4 w-4" />
                      Test Connection
                    </>
                  )}
                </Button>

                <Button
                  type="submit"
                  disabled={isSaving || (!environment && !testSuccessful)}
                  title={
                    !environment && !testSuccessful
                      ? 'Please test the connection first'
                      : ''
                  }
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {environment ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      {environment
                        ? 'Update Environment'
                        : 'Create Environment'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {!canEdit && (
            <Alert>
              <AlertDescription>
                You don&apos;t have permission to edit environment
                configuration. Only workspace Owners and Authors can modify
                these settings.
              </AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
