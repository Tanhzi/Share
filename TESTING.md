# 🧪 Testing Guide for Sharedocu

## Test Coverage Goals

- **Unit Tests**: Utils, helpers, hooks
- **Component Tests**: UI components
- **Integration Tests**: API calls, navigation flows
- **E2E Tests**: Critical user journeys

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific test file
npm test -- PasswordModal.test.tsx
```

## Test Structure

```
__tests__/
├── setup.ts                 # Test setup and mocks
├── App.test.tsx            # Main app test
├── components/             # Component tests
│   ├── PasswordModal.test.tsx
│   ├── DocumentCard.test.tsx
│   └── ...
├── hooks/                  # Hook tests
│   ├── useNetworkStatus.test.tsx
│   ├── useFileDownload.test.ts
│   └── ...
├── utils/                  # Utility tests
│   ├── format.test.ts
│   ├── validation.test.ts
│   └── ...
└── e2e/                    # E2E tests (future)
    ├── auth.e2e.ts
    ├── share.e2e.ts
    └── ...
```

## Writing Tests

### Component Test Example

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button', () => {
  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button title="Click me" onPress={onPress} />
    );
    
    fireEvent.press(getByText('Click me'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

### Hook Test Example

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useCounter } from '../useCounter';

describe('useCounter', () => {
  it('increments counter', () => {
    const { result } = renderHook(() => useCounter());
    
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.count).toBe(1);
  });
});
```

## Mocking Dependencies

### Mock API Calls

```typescript
jest.mock('../api/client', () => ({
  apiGet: jest.fn().mockResolvedValue({ data: {} }),
  apiPost: jest.fn().mockResolvedValue({ data: {} }),
}));
```

### Mock Navigation

```typescript
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
}));
```

## Test Coverage Goals

| Component Type | Target Coverage |
|----------------|----------------|
| Utils/Helpers  | 90%+           |
| Components     | 80%+           |
| Screens        | 70%+           |
| Hooks          | 85%+           |

## Critical Paths to Test

1. **Auth Flow**
   - Login/Logout
   - Token expiry
   - Guest mode

2. **Document Sharing**
   - File upload
   - Password protection
   - Document scan

3. **Sync Center**
   - Link accounts
   - Document sync
   - Auto-download

4. **Network Handling**
   - Offline mode
   - Retry logic
   - Connection loss

## Best Practices

1. **Test Behavior, Not Implementation**
   - Test what the code does, not how it does it

2. **Use Descriptive Test Names**
   - `it('should increment counter when button pressed')`

3. **Mock External Dependencies**
   - API calls, storage, geolocation

4. **Test Edge Cases**
   - Empty states
   - Error states
   - Loading states

5. **Keep Tests Independent**
   - Each test should run in isolation

## Debugging Tests

```bash
# Run with verbose output
npm test -- --verbose

# Run only failed tests
npm test -- --onlyFailed

# Run tests matching pattern
npm test -- --testNamePattern="PasswordModal"
```

## CI/CD Integration

Add to your CI pipeline:

```yaml
- name: Run Tests
  run: npm run test:coverage
  
- name: Check Coverage
  run: npm run test:coverage -- --threshold=80
```
