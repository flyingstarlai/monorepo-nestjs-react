# With-NestJs | API

## Getting Started

First, run the development server:

```bash
pnpm run dev
# Also works with NPM, YARN, BUN, ...
```

By default, your server will run at [localhost:3000](http://localhost:3000). You can use your favorite API platform like [Insomnia](https://insomnia.rest/) or [Postman](https://www.postman.com/) to test your APIs

## API Endpoints

### Authentication
- `POST /auth/login` - User login (records login activity)
- `POST /auth/change-password` - Change password (records password change activity)
- `GET /auth/profile` - Get current user profile

### Users
- `PUT /users/profile` - Update user profile (records profile update activity)
- `PUT /users/avatar` - Update user avatar (records avatar update activity)
- `GET /users` - List all users (Admin only)
- `PATCH /users/:id/status` - Update user status (Admin only)
- `PATCH /users/:id/role` - Update user role (Admin only)

### Activities
- `GET /activities` - Get current user's recent activities
  - Query parameters:
    - `limit` (optional, default: 20) - Number of activities to return
    - `cursor` (optional) - Pagination cursor for fetching older activities
  - Requires JWT authentication
  - Returns activities in reverse chronological order (newest first)

## Database Schema

### Activity Table
The `activities` table stores user activity events with the following schema:
- `id` (UUID, primary key) - Unique activity identifier
- `ownerId` (string, foreign key) - ID of the user this activity belongs to
- `type` (enum) - Activity type: `login_success`, `profile_updated`, `password_changed`, `avatar_updated`
- `message` (string) - Human-readable activity message
- `metadata` (JSON, nullable) - Optional additional data
- `createdAt` (datetime) - When the activity occurred

**Database Engine**: PostgreSQL 15 in every environment. TypeORM migrations run automatically at startup, and the first boot seeds default roles plus admin (`admin/nimda`) and user (`user/user123`) accounts for testing. An index on `(owner_id, createdAt)` keeps activity pagination efficient.

You can start editing the demo **APIs** by modifying [linksService](./src/links/links.service.ts) provider.

### Important Note 🚧

If you plan to `build` or `test` the app. Please make sure to build the `packages/*` first.

## Learn More

Learn more about `NestJs` with following resources:

- [Official Documentation](https://docs.nestjs.com) - A progressive Node.js framework for building efficient, reliable and scalable server-side applications.
- [Official NestJS Courses](https://courses.nestjs.com) - Learn everything you need to master NestJS and tackle modern backend applications at any scale.
- [GitHub Repo](https://github.com/nestjs/nest)
