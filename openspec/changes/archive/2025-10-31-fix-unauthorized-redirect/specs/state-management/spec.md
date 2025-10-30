## MODIFIED Requirements

### Requirement: Authentication State Management

The application SHALL maintain consistent authentication state across all components and handle unauthorized API responses by redirecting users to the login page.

#### Scenario: API unauthorized response

- WHEN an API call returns 401 Unauthorized
- THEN the application SHALL dispatch auth:logout event
- THEN the application SHALL update auth state to unauthenticated
- THEN the application SHALL redirect to /login with current URL as redirect parameter

#### Scenario: Global logout event handling

- WHEN auth:logout event is dispatched globally
- THEN the application SHALL clear authentication state
- THEN the application SHALL remove stored tokens
- THEN the application SHALL redirect to login page
