# Testing Guide for AlohaWaii API

## 🧠 Understanding Our Testing Strategy

This guide explains our modern testing approach using Jest, TypeScript, and Docker. We've moved away from shell scripts to a comprehensive testing framework that's maintainable, reliable, and educational.

### Why We Test

```
🎯 Goals of Testing:
✅ Catch bugs before users do
✅ Enable safe refactoring
✅ Document expected behavior
✅ Build confidence in deployments
✅ Facilitate team collaboration
```

### Testing Pyramid

```
           🔺 E2E Tests (10%)
          Complex, Slow, Brittle
         Test complete workflows
        🔺🔺 Integration Tests (20%)
       Multiple components together
      Real database, Real API calls
     🔺🔺🔺 Unit Tests (70%)
    Fast, Isolated, Deterministic
   Test individual functions/components
```

## 🏗️ Test Architecture

### Directory Structure

```
tests/
├── unit/                 # Fast, isolated tests
│   ├── health.test.ts
│   └── auth-helpers.test.ts
├── integration/          # Component interaction tests
│   └── user-api.test.ts
├── e2e/                  # Complete workflow tests
│   └── auth-flow.test.ts
└── helpers/              # Shared test utilities
    └── test-utils.ts
```

### Test Types Explained

#### 🏃‍♂️ Unit Tests
- **Purpose**: Test individual functions in isolation
- **Speed**: ⚡ Very fast (milliseconds)
- **Dependencies**: All mocked
- **When to use**: Business logic, utilities, pure functions

```typescript
// Example: Testing a utility function
it('should validate email format', () => {
  expect(isValidEmail('user@example.com')).toBe(true)
  expect(isValidEmail('invalid-email')).toBe(false)
})
```

#### 🔗 Integration Tests
- **Purpose**: Test components working together
- **Speed**: ⚡ Fast (seconds)
- **Dependencies**: Real database, mocked external APIs
- **When to use**: API endpoints, database operations, authentication

```typescript
// Example: Testing API endpoint with real database
it('should create user with valid data', async () => {
  const response = await POST('/api/users', validUserData)
  expect(response.status).toBe(201)
  
  // Verify user was saved to database
  const user = await prisma.user.findUnique({ where: { email: validUserData.email }})
  expect(user).toBeDefined()
})
```

#### 🚀 End-to-End (E2E) Tests
- **Purpose**: Test complete user workflows
- **Speed**: 🐌 Slower (minutes)
- **Dependencies**: Real everything
- **When to use**: Critical business flows, deployment verification

```typescript
// Example: Testing complete authentication flow
it('should allow user to login and access protected route', async () => {
  // Start real server
  const response1 = await request(app).post('/auth/login').send(credentials)
  const token = response1.body.token
  
  const response2 = await request(app)
    .get('/api/protected')
    .set('Authorization', `Bearer ${token}`)
  
  expect(response2.status).toBe(200)
})
```

## 🚀 Getting Started

### Prerequisites

1. **Docker**: For test database
2. **Node.js 18+**: For running tests
3. **API dependencies**: Run `npm install` in `/api` directory

### Quick Start

```bash
# 1. Start test database
npm run test:setup:unit      # Unit tests only (no database needed)
npm run test:setup:integration  # Integration tests with database
npm run test:setup:e2e       # Full E2E tests
npm run test:setup           # All tests

# 2. Watch mode for development
npm run test:setup:watch

# 3. Coverage reports
npm run test:setup:coverage
```

### Manual Test Database Setup

```bash
# Start test database manually
docker-compose -f docker-compose.test.yml up -d test-db

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e

# Clean up
docker-compose -f docker-compose.test.yml down
```

## 🛠️ Test Configuration

### Jest Configuration

Our Jest setup includes:

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}
```

### Environment Variables

Tests use separate environment variables:

```bash
# Test Database
TEST_DATABASE_URL=postgresql://test:test@localhost:5433/alohawaii_test

# Test Authentication
NEXTAUTH_URL=http://localhost:4001
NEXTAUTH_SECRET=test-secret-key

# Mock OAuth
GOOGLE_CLIENT_ID=mock-google-client-id
GOOGLE_CLIENT_SECRET=mock-google-client-secret
```

## 📝 Writing Tests

### Test Structure (AAA Pattern)

```typescript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup before each test
  })

  it('should do something specific', () => {
    // ARRANGE: Set up test data
    const input = { name: 'test' }
    
    // ACT: Execute the function
    const result = functionUnderTest(input)
    
    // ASSERT: Verify the result
    expect(result).toEqual(expectedOutput)
  })
})
```

### Using Test Utilities

We provide utilities to make testing easier:

```typescript
import { 
  mockUserFactory, 
  createMockRequest, 
  responseHelpers, 
  dbHelpers 
} from '../helpers/test-utils'

// Create test data
const testUser = mockUserFactory({ role: 'ADMIN' })

// Create mock HTTP requests
const request = createMockRequest('/api/test', { method: 'POST' })

// Test API responses
await responseHelpers.expectSuccessResponse(response, expectedData)

// Database operations
await dbHelpers.cleanDatabase()
const user = await dbHelpers.createTestUser()
```

### Mocking External Dependencies

```typescript
// Mock NextAuth
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}))

// Mock Prisma for unit tests
jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    }
  }
}))
```

## 🏃‍♂️ Running Tests

### Development Workflow

```bash
# 1. Watch mode while coding
npm run test:setup:watch

# 2. Run specific test file
npm test -- auth-helpers.test.ts

# 3. Run tests matching pattern
npm test -- --testNamePattern="authentication"

# 4. Debug failing tests
npm test -- --verbose --detectOpenHandles
```

### CI/CD Integration

```bash
# CI mode (no watch, exit on completion)
npm run test:setup -- --ci

# Coverage reporting
npm run test:setup:coverage

# Specific test types for different CI stages
npm run test:setup:unit      # Fast feedback
npm run test:setup:integration  # Pre-deploy verification
npm run test:setup:e2e       # Post-deploy smoke tests
```

### Docker-based Testing

```bash
# Run tests in containers
docker-compose -f docker-compose.test.yml --profile testing up test-runner

# Full isolated environment
docker-compose -f docker-compose.test.yml up
```

## 🧪 Test Examples

### Unit Test Example

```typescript
describe('isEmailFromWhitelistedDomain', () => {
  it('should return true for whitelisted domain', async () => {
    // ARRANGE: Mock database response
    mockPrisma.whitelistedDomain.findUnique.mockResolvedValue({
      id: '1',
      domain: 'testcompany.com'
    })

    // ACT: Test the function
    const result = await isEmailFromWhitelistedDomain('user@testcompany.com')

    // ASSERT: Verify result and mock calls
    expect(result).toBe(true)
    expect(mockPrisma.whitelistedDomain.findUnique).toHaveBeenCalledWith({
      where: { domain: 'testcompany.com' }
    })
  })
})
```

### Integration Test Example

```typescript
describe('POST /api/users', () => {
  beforeEach(async () => {
    await dbHelpers.cleanDatabase()
  })

  it('should create user with valid data', async () => {
    // ARRANGE: Prepare test data
    const userData = {
      email: 'newuser@testcompany.com',
      name: 'New User'
    }

    // Create whitelisted domain
    await dbHelpers.createWhitelistedDomain('testcompany.com')

    // ACT: Make API request
    const response = await request(app)
      .post('/api/users')
      .send(userData)

    // ASSERT: Verify response and database state
    expect(response.status).toBe(201)
    
    const createdUser = await prisma.user.findUnique({
      where: { email: userData.email }
    })
    expect(createdUser).toBeDefined()
    expect(createdUser.name).toBe(userData.name)
  })
})
```

### E2E Test Example

```typescript
describe('Authentication Flow E2E', () => {
  it('should complete full authentication workflow', async () => {
    // ARRANGE: Start test server
    const server = await startTestServer()

    // ACT: Simulate user authentication
    const loginResponse = await request(server)
      .post('/auth/signin')
      .send({ email: 'user@testcompany.com' })

    const profileResponse = await request(server)
      .get('/api/internal/users/me')
      .set('Authorization', `Bearer ${loginResponse.body.token}`)

    // ASSERT: Verify complete workflow
    expect(loginResponse.status).toBe(200)
    expect(profileResponse.status).toBe(200)
    expect(profileResponse.body.data.email).toBe('user@testcompany.com')
  })
})
```

## 📊 Coverage and Reporting

### Coverage Goals

```
📈 Coverage Targets:
- Unit Tests: 90%+ coverage
- Integration Tests: 80%+ coverage
- E2E Tests: Critical paths only
- Overall: 85%+ coverage
```

### Viewing Coverage

```bash
# Generate coverage report
npm run test:setup:coverage

# Open HTML report
open coverage/lcov-report/index.html
```

### Coverage Configuration

```javascript
// jest.config.js
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80
  },
  './src/lib/': {
    branches: 90,
    functions: 90
  }
}
```

## 🛠️ Debugging Tests

### Common Issues

1. **Database Connection Errors**
```bash
# Check if test database is running
docker ps | grep alohawaii-test-db

# Restart test database
docker-compose -f docker-compose.test.yml restart test-db
```

2. **Port Conflicts**
```bash
# Check what's using port 5433
lsof -i :5433

# Use different port
TEST_DATABASE_URL=postgresql://test:test@localhost:5434/alohawaii_test
```

3. **Memory Issues**
```bash
# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=4096" npm test
```

### Debug Mode

```bash
# Verbose output
npm test -- --verbose

# Debug specific test
npm test -- --testNamePattern="specific test" --verbose

# Keep database running for inspection
npm run test:setup -- --no-cleanup
```

## 🔄 Continuous Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: cd api && npm ci
      
      - name: Run unit tests
        run: cd api && npm run test:setup:unit
      
      - name: Run integration tests
        run: cd api && npm run test:setup:integration -- --ci
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## 📚 Learning Resources

### Testing Concepts
- [Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/)

### Best Practices
- [Test-Driven Development](https://martinfowler.com/bliki/TestDrivenDevelopment.html)
- [API Testing Best Practices](https://blog.postman.com/api-testing-best-practices/)
- [Database Testing Strategies](https://www.prisma.io/docs/guides/testing)

## 🤝 Contributing

### Adding New Tests

1. **Choose the right test type**:
   - Unit: Pure functions, business logic
   - Integration: API endpoints, database operations
   - E2E: Critical user workflows

2. **Use descriptive names**:
   ```typescript
   // ❌ Bad
   it('should work', () => {})
   
   // ✅ Good
   it('should return 401 when user is not authenticated', () => {})
   ```

3. **Follow AAA pattern**:
   - Arrange: Set up test data
   - Act: Execute the code
   - Assert: Verify results

4. **Keep tests independent**:
   - Each test should be able to run alone
   - Use beforeEach/afterEach for setup/cleanup
   - Don't rely on test execution order

5. **Test both happy and sad paths**:
   ```typescript
   describe('createUser', () => {
     it('should create user with valid data', () => {})
     it('should reject invalid email format', () => {})
     it('should handle database errors gracefully', () => {})
   })
   ```

### Updating Test Configuration

When adding new features:
1. Update test utilities if needed
2. Add new mock data factories
3. Update Jest configuration for new paths
4. Document new testing patterns

---

*This testing setup replaces the old shell-based approach with a modern, maintainable, and educational testing framework. Each test includes learning explanations to help team members understand not just what to test, but why and how to test effectively.*
