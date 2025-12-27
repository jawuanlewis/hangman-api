# Project Testing

This directory contains all tests for the `hangman-api` project.

## Directory Organization

```text
tests/
├── setup.js                 # Global test setup (MongoDB Memory Server)
├── unit/                    # Unit tests (isolated component tests)
│   ├── config/              # Config module tests
│   ├── controllers/         # Controller logic tests
│   ├── middleware/          # Middleware tests
│   └── schemas/             # Schema validation tests
└── integration/             # Integration tests (full request/response cycle)
    └── api/                 # API endpoint tests
```

## Test Types

### Unit Tests (`tests/unit/`)

- Test individual functions and modules in isolation
- Mock external dependencies (database, external services)
- Fast execution
- Focus on business logic and edge cases

### Integration Tests (`tests/integration/`)

- Test complete request/response cycles
- Use MongoDB Memory Server for real database operations
- Test middleware chains and full API behavior
- Verify proper integration between components

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run only unit tests
pnpm test:unit

# Run only integration tests
pnpm test:integration
```

## Writing Tests

### Example Unit Test

```javascript
import { describe, it, expect } from 'vitest';
import { yourFunction } from '@/path/to/module.js';

describe('YourModule', () => {
  it('should do something', () => {
    const result = yourFunction();
    expect(result).toBe(expectedValue);
  });
});
```

### Example Integration Test

```javascript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '@/server.js';

describe('POST /api/v1/games', () => {
  it('should create a new game', async () => {
    const response = await request(app)
      .post('/api/v1/games')
      .send({ level: 'Movies' });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });
});
```
