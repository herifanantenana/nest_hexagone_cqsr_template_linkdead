# AGENTS.md - Developer Guidelines for nest_hexagone_cqsr_template_linkdead

## Project Overview

This is a NestJS application following **Hexagonal Architecture** with **CQRS** (Command Query Responsibility Segregation) pattern. The codebase uses Drizzle ORM with PostgreSQL.

## Build, Lint, and Test Commands

### Development

```bash
pnpm install           # Install dependencies
pnpm run start         # Start in development mode
pnpm run start:dev     # Start with hot reload (watch mode)
pnpm run start:debug  # Start with debugging enabled
pnpm run start:prod   # Start production build
```

### Build

```bash
pnpm run build        # Compile TypeScript to dist/
```

### Linting & Formatting

```bash
pnpm run lint         # Run ESLint with auto-fix
pnpm run format      # Format code with Prettier
```

### Testing

```bash
pnpm run test             # Run all unit tests
pnpm run test -- path/to/file.spec.ts    # Run single test file
pnpm run test -- --testNamePattern="test name"  # Run specific test
pnpm run test:watch      # Run tests in watch mode
pnpm run test:cov       # Run tests with coverage report
pnpm run test:e2e        # Run end-to-end tests
```

### Database Commands

```bash
pnpm run db:push         # Push schema to database
pnpm run db:pull        # Pull schema from database
pnpm run db:generate    # Generate migrations
pnpm run db:migrate     # Run migrations
pnpm run db:studio      # Open Drizzle Studio
pnpm run db:reset       # Reset database (clean + migrate)
```

## Code Style Guidelines

### Formatting (Prettier)

- **Print width**: 120 characters
- **Use tabs**: Yes (2 spaces width)
- **Single quotes**: No (use double quotes)
- **Trailing commas**: All
- **End of line**: LF
- Run `pnpm run format` to auto-format

### TypeScript Configuration

- **Target**: ES2023
- **Module**: nodenext
- **Strict null checks**: Enabled
- **Implicit any**: Allowed (noImplicitAny: false)

### Path Aliases

Use these aliases instead of relative imports:

```typescript
import { ... } from '@apk_core*'   // ./src/core/*
import { ... } from '@apk_modules/*'  // ./src/modules/*
import { ... } from '@apk_shared/*'   // ./src/shared/*
import { ... } from '@apk_common_infra/*'  // ./src/core/infra/*
```

### Naming Conventions

| Element | Convention | Example |
|---------|------------|--------- (|
| Filesclasses) | kebab-case | `users.service.ts` |
| Classes | PascalCase | `UsersService` |
| Interfaces | PascalCase | `CreateUserDto` |
| Types | PascalCase | `UserResponse` |
| Variables | camelCase | `userList` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Database tables | snake_case | `usersTable` |
| Table columns | snake_case | `first_name` |

### Import Order (ESLint will enforce)

1. External libraries (NestJS, etc.)
2. Internal modules (@apk_common, @apk_modules, etc.)
3. Relative imports (../, ./)
4. Type imports

```typescript
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { User } from "@apk_modules/users/domain/user.entity";
```

### Error Handling

- Use NestJS built-in exceptions (`BadRequestException`, `NotFoundException`, etc.)
- Create custom exceptions in `@apk_coreexceptions`
- Use class-validator for DTO validation with `@IsString()`, `@IsEmail()`, etc.
- Always validate input with pipes (`ValidationPipe`)

### DTOs and Validation

- Use `class-validator` decorators
- Use `class-transformer` for serialization
- Example:

```typescript
import { IsString, IsEmail, MinLength } from "class-validator";

export class CreateUserDto {
	@IsString()
	@MinLength(2)
	firstName: string;

	@IsString()
	@MinLength(2)
	lastName: string;

	@IsEmail()
	email: string;
}
```

### Database Schema Conventions

- Define schemas in `@apk_modules/*/infra/database/schemas`
- Use shared utilities from `src/core//infra/database/schemas/_shared/`:
  - `id` for UUID primary keys
  - `createdAt`, `updatedAt`, `deletedAt` for timestamps
- Table names in snake_case, exports as `*Table`

### Architecture (Hexagonal + CQRS)

```
src/
├── core           # Shared utilities, guards, interceptors, pipes
├── core/             # Core infrastructure (config, database, auth)
├── modules/          # Feature modules (hexagonal architecture)
│   └── [feature]/
│       ├── domain/       # Entities, value objects
│       ├── application/  # Use cases, commands, queries, handlers
│       ├── infra/        # Database, external services
│       └── presentation/ # Controllers, DTOs, guards
└── shared/           # Shared business logic
```

### Testing Guidelines

- Test files: `*.spec.ts` in same directory as code
- Use `@nestjs/testing` utilities
- Follow AAA pattern: Arrange, Act, Assert
- Mock external dependencies (database, services)

### Environment Variables

- Development: `.env.dev`
- Production: `.env.prod`
- Config loaded in `src/core//config/`

### Git Conventions

- Use conventional commits (not enforced but recommended)
- Run `pnpm run lint` and `pnpm run test` before committing
