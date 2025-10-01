# End-to-End and Integration Tests

This directory contains comprehensive end-to-end and integration tests for the University Job Bank application.

## Test Files

### `critical-user-flows.spec.ts`
Tests the most important user journeys that must work for the application to be functional:

- **Authentication Flow**: Registration, login, email validation
- **Job Posting Flow**: Creating and managing job postings (faculty)
- **Job Search and Application Flow**: Finding and applying for jobs (students)
- **Application Management Flow**: Reviewing and managing applications (faculty)
- **Notification System**: In-app and email notifications
- **Profile Management**: User profile updates
- **Admin Functions**: User management and platform administration
- **Responsive Design**: Mobile and tablet compatibility
- **Error Handling**: Graceful error states and recovery

### `production-deployment.spec.ts`
Validates the production environment and deployment:

- **Production Environment Health**: Basic connectivity and health checks
- **Database Connectivity**: Production database access and performance
- **File Storage Integration**: Supabase Storage functionality
- **Email Service Integration**: Email notification system
- **Performance Tests**: Core Web Vitals and load testing
- **SEO and Accessibility**: Meta tags and accessibility compliance
- **Error Handling in Production**: 404 pages and API error handling
- **Monitoring and Logging**: Error tracking and performance monitoring

### `integration-tests.spec.ts`
Tests integration between different system components:

- **Supabase Integration**: Authentication, database, and real-time features
- **File Upload Integration**: Resume uploads to Supabase Storage
- **Email Notification Integration**: Automated email triggers
- **Search and Filtering Integration**: Full-text search and filtering
- **Role-Based Access Control**: Permission enforcement
- **Data Validation Integration**: Form validation and data integrity
- **Performance Integration**: Large dataset handling and pagination

### `auth.setup.ts`
Authentication setup for tests that require logged-in users:

- Creates authenticated browser contexts for different user roles
- Stores authentication state for reuse across tests
- Provides clean authentication for faculty, student, and admin users

### `global-setup.ts`
Global test environment setup:

- Verifies application accessibility
- Prepares test environment
- Can be extended for test data seeding

## Running Tests

### Local Development

```bash
# Run all E2E tests
npm run test:e2e

# Run with browser UI (for debugging)
npm run test:e2e:headed

# Run interactive mode
npm run test:e2e:ui

# Run specific test file
npx playwright test critical-user-flows.spec.ts

# Run specific test
npx playwright test -g "should allow faculty registration"
```

### Production Testing

```bash
# Test against production environment
npm run test:production

# Set custom production URL
PRODUCTION_URL=https://your-domain.com npm run test:production
```

### Integration Testing

```bash
# Run integration tests only
npm run test:integration

# Run with specific browser
npx playwright test integration-tests.spec.ts --project=firefox
```

## Test Data Requirements

### Test Users

The tests expect these users to exist in the database:

- `faculty@acadiau.ca` (role: faculty, department: Computer Science)
- `student@acadiau.ca` (role: student, department: Computer Science, year: 2)
- `admin@acadiau.ca` (role: admin)

All test users should have the password: `testpassword123`

### Test Jobs

Some tests expect existing job postings in the database. The seed data should include:

- At least 5 job postings from different departments
- Mix of job types (research_assistant, teaching_assistant, etc.)
- Some jobs with applications, some without
- Jobs with different deadlines (past, present, future)

### Test Applications

For application management tests:

- Student should have existing applications to some jobs
- Faculty should have jobs with received applications
- Mix of application statuses (pending, reviewed, accepted, rejected)

## Test Configuration

### Environment Variables

```bash
# Base URL for testing (defaults to localhost:3000)
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000

# Production URL for production tests
PRODUCTION_URL=https://university-job-bank.vercel.app

# Skip E2E tests in deployment validation
SKIP_E2E=true
```

### Browser Configuration

Tests run on multiple browsers and devices:

- **Desktop**: Chrome, Firefox, Safari
- **Mobile**: Chrome on Pixel 5, Safari on iPhone 12

### Timeouts and Retries

- **Test timeout**: 30 seconds per test
- **Retries**: 2 retries on CI, 0 locally
- **Global timeout**: 10 minutes for entire test suite

## Debugging Tests

### Visual Debugging

```bash
# Run with browser visible
npx playwright test --headed

# Debug specific test
npx playwright test --debug -g "test name"

# Step through test
npx playwright test --ui
```

### Trace Analysis

```bash
# Run with trace
npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip
```

### Screenshots and Videos

Failed tests automatically capture:
- Screenshots at failure point
- Video recording of test execution
- Network logs and console output

## Continuous Integration

### GitHub Actions

Tests run automatically on:
- Every push to main/develop
- Pull requests to main
- Daily schedule for production monitoring

### Test Reports

- **HTML Report**: Detailed test results with screenshots
- **JUnit XML**: For CI integration
- **Coverage Report**: Code coverage from unit tests

## Best Practices

### Writing Tests

1. **Use data-testid attributes** for reliable element selection
2. **Wait for elements** instead of using fixed delays
3. **Test user workflows** not implementation details
4. **Keep tests independent** - no shared state between tests
5. **Use descriptive test names** that explain the expected behavior

### Maintaining Tests

1. **Update selectors** when UI changes
2. **Keep test data current** with application changes
3. **Monitor test performance** and optimize slow tests
4. **Review failed tests** promptly in CI

### Performance

1. **Parallelize tests** where possible
2. **Reuse authentication** across tests
3. **Minimize network requests** in setup
4. **Use efficient selectors** for better performance

## Troubleshooting

### Common Issues

1. **Flaky tests**: Add proper waits, check for race conditions
2. **Slow tests**: Optimize selectors, reduce unnecessary waits
3. **Authentication failures**: Verify test user credentials
4. **Element not found**: Check if UI has changed, update selectors
5. **Timeout errors**: Increase timeout or optimize test logic

### Getting Help

- Check the test output and screenshots
- Use Playwright trace viewer for detailed debugging
- Review the application logs for backend issues
- Consult the team documentation for test data setup