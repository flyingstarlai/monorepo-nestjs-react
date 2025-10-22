# Dashboard Web Application

A modern React-based dashboard frontend with authentication, user management, admin features, and real-time activities feed.

## Tech Stack

- **Framework**: React 19 with TypeScript 5
- **Build Tool**: Vite 7 with Turborepo
- **Routing**: TanStack Router v1 (file-based routing)
- **Forms**: @tanstack/react-form with Zod validation
- **Data Fetching**: TanStack Query v5 for server state
- **UI Components**: Shadcn UI (Radix UI primitives)
- **Styling**: Tailwind CSS v4 with utility-first approach
- **State Management**: TanStack Query + React Context
- **Testing**: Vitest 3 + Testing Library
- **Linting**: Biome 2 for formatting and linting

## Getting Started

To run this application:

```bash
pnpm install
pnpm dev
```

The application will be available at [http://localhost:5173](http://localhost:5173).

## Building For Production

To build this application for production:

```bash
pnpm build
```

The build output will be in the `dist/` directory.

## Testing

This project uses [Vitest](https://vitest.dev/) for testing. You can run the tests with:

```bash
pnpm test
```

## Styling

This project uses [Tailwind CSS](https://tailwindcss.com/) for styling.

## Environment Variables

This project uses Vite environment variables. Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

### Available Variables

- `VITE_API_BASE_URL`: Base URL for API calls (default: `http://localhost:3000`)
- `VITE_ENABLE_DEVTOOLS`: Enable/disable TanStack devtools (default: `true`)

### API Integration

The application integrates with the NestJS backend using:
- JWT token storage in localStorage
- Automatic token injection in API calls
- Optimistic updates with TanStack Query
- Error handling with user-friendly messages
- Request/response interceptors for auth

## Linting & Formatting

This project uses [Biome](https://biomejs.dev/) for linting and formatting. The following scripts are available:

```bash
pnpm lint
pnpm format
pnpm check
```

## Shadcn

Add components using the latest version of [Shadcn](https://ui.shadcn.com/).

```bash
pnpx shadcn@latest add button
```

## Routing

This project uses [TanStack Router](https://tanstack.com/router). The initial setup is a file based router. Which means that the routes are managed as files in `src/routes`.

### Adding A Route

To add a new route to your application just add another a new file in the `./src/routes` directory.

TanStack will automatically generate the content of the route file for you.

Now that you have two routes you can use a `Link` component to navigate between them.

### Adding Links

To use SPA (Single Page Application) navigation you will need to import the `Link` component from `@tanstack/react-router`.

```tsx
import { Link } from '@tanstack/react-router';
```

Then anywhere in your JSX you can use it like so:

```tsx
<Link to="/about">About</Link>
```

This will create a link that will navigate to the `/about` route.

More information on the `Link` component can be found in the [Link documentation](https://tanstack.com/router/v1/docs/framework/react/api/router/linkComponent).

### Using A Layout

In the File Based Routing setup the layout is located in `src/routes/__root.tsx`. Anything you add to the root route will appear in all the routes. The route content will appear in the JSX where you use the `<Outlet />` component.

Here is an example layout that includes a header:

```tsx
import { Outlet, createRootRoute } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

import { Link } from '@tanstack/react-router';

export const Route = createRootRoute({
  component: () => (
    <>
      <header>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
        </nav>
      </header>
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
});
```

The `<TanStackRouterDevtools />` component is not required so you can remove it if you don't want it in your layout.

More information on layouts can be found in the [Layouts documentation](https://tanstack.com/router/latest/docs/framework/react/guide/routing-concepts#layouts).

## Features

### Recent Activities Feed
The dashboard includes a live Recent Activities feed that displays:
- Login success events
- Profile updates
- Password changes
- Avatar updates

The feed automatically updates when users perform these actions and includes:
- Loading skeleton states with Shadcn UI components
- Empty state when no activities exist
- Error handling with retry functionality
- Relative timestamps (e.g., "2 hours ago")
- Activity-type icons and colors using Lucide React

### Authentication & User Management
- JWT-based authentication with automatic token refresh
- Role-based access control (Admin/User) with route guards
- Profile management with optimistic updates
- Avatar upload with 2MB limit and image preview
- Password change functionality with validation
- Protected routes with `beforeLoad` guards

### Admin Panel
- User management (create, enable/disable, role changes)
- Admin-only access controls with role-based UI
- Safety rules (self-protection, last-admin protection)
- Real-time user list updates with TanStack Query
- Bulk operations and user search

### Modern Form Handling
- **TanStack React Form**: Declarative form management
- **Zod Validation**: Type-safe schema validation
- **Optimistic UI**: Instant feedback on form submissions
- **Error Handling**: Comprehensive error display and recovery
- **Accessibility**: ARIA labels and keyboard navigation

### Responsive Design
- Mobile-first approach with Tailwind CSS
- Adaptive layouts for all screen sizes
- Touch-friendly interactions
- Dark mode support (configurable)

## Data Fetching & State Management

### TanStack Query Integration

The application uses TanStack Query for server state management with the following patterns:

```tsx
// Custom hook for API calls
export function useUsersQuery() {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => adminApi.listUsers(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Mutation with optimistic updates
export function useCreateUserMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: CreateUserPayload) => adminApi.createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User created successfully');
    },
  });
}
```

### API Layer Architecture

The application follows a layered API architecture:

```tsx
// API service layer
export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    
    if (!response.ok) {
      throw new AuthError('Invalid credentials');
    }
    
    return response.json();
  },
};

// Token management
export const tokenStorage = {
  getToken(): string | null {
    return localStorage.getItem('access_token');
  },
  // ... other token methods
};
```

### Authentication Context

React Context provides global authentication state:

```tsx
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Authentication logic here
  
  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

## Form Management with TanStack React Form

### Form Patterns

The application uses TanStack React Form for type-safe form handling:

```tsx
// Form with Zod validation
const form = useForm({
  defaultValues: {
    username: '',
    password: '',
  },
  validators: {
    onSubmit: loginSchema,
  },
  onSubmit: async ({ value }) => {
    await login(value);
    router.navigate({ to: '/dashboard' });
  },
});

// Field usage
<form.Field name="username">
  {(field) => (
    <Field>
      <FieldLabel>Username</FieldLabel>
      <Input
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
      />
      <FieldError errors={field.state.meta.errors} />
    </Field>
  )}
</form.Field>
```

### Validation Strategy

- **Zod Schemas**: Type-safe validation rules
- **Field-level Validation**: Real-time validation feedback
- **Form Submission**: Comprehensive validation before submit
- **Error Display**: User-friendly error messages

## Testing Strategy

### Test Structure

```tsx
// Component testing with Testing Library
describe('LoginForm', () => {
  it('renders login form correctly', () => {
    render(<LoginForm />);
    
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });
  
  it('handles form submission', async () => {
    const mockLogin = vi.fn();
    render(<LoginForm />);
    
    // Fill form and submit
    // ... test implementation
  });
});
```

### Test Coverage Areas

- **Authentication Flows**: Login, logout, password changes
- **User Management**: CRUD operations, role changes
- **Form Validation**: Error handling and user feedback
- **Route Guards**: Protected routes and role-based access
- **API Integration**: Mock API responses and error states

## Performance Optimizations

### Code Splitting
- Automatic route-based code splitting with TanStack Router
- Lazy loading of heavy components
- Dynamic imports for admin features

### Bundle Optimization
- Tree shaking for unused dependencies
- Asset optimization with Vite
- Production builds with minification

### Caching Strategy
- TanStack Query caching with stale-while-revalidate
- API response caching for user data
- Optimistic updates for better UX

## Deployment

### Docker Deployment

```bash
# Build Docker image
docker build -t dashboard-web .

# Run with Docker Compose
docker-compose up web
```

### Production Considerations

- Use HTTPS in production
- Configure proper CORS headers
- Set up CDN for static assets
- Monitor bundle size and performance
- Configure proper error tracking

## Available Scripts

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm serve            # Preview production build

# Testing
pnpm test             # Run tests
pnpm test:ui          # Run tests with UI

# Code Quality
pnpm lint             # Run Biome linter
pnpm format           # Format code
pnpm check            # Run all checks (lint + format)
```

# Learn More

You can learn more about all of the offerings from TanStack in the [TanStack documentation](https://tanstack.com).

### Key Documentation
- [TanStack Router](https://tanstack.com/router) - File-based routing
- [TanStack Query](https://tanstack.com/query) - Server state management
- [TanStack Form](https://tanstack.com/form) - Form management
- [Shadcn UI](https://ui.shadcn.com) - Component library
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS
- [Vite](https://vitejs.dev) - Build tool and dev server
