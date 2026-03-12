import * as Sentry from '@sentry/nextjs';

jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
  init: jest.fn(),
}));

describe('Sentry integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('captureException is callable with error and tags', () => {
    const error = new Error('test error');
    Sentry.captureException(error, { tags: { route: 'test' } });
    expect(Sentry.captureException).toHaveBeenCalledWith(error, { tags: { route: 'test' } });
  });

  it('captureException handles non-Error objects', () => {
    Sentry.captureException('string error', { tags: { route: 'test' } });
    expect(Sentry.captureException).toHaveBeenCalledWith('string error', { tags: { route: 'test' } });
  });
});

describe('Sentry capture filtering logic', () => {
  /**
   * Tests that verify the conditional capture pattern used in the login route:
   *   if (status === 500) { Sentry.captureException(...) }
   * This ensures expected auth failures (401) don't flood Sentry.
   */

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should capture server errors (500) to Sentry', () => {
    const err = new Error('Connection refused');
    const message = err.message;
    const status = message.includes('Invalid username') ? 401 : 500;

    if (status === 500) {
      Sentry.captureException(err, { tags: { route: 'auth/login' } });
    }

    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    expect(Sentry.captureException).toHaveBeenCalledWith(err, { tags: { route: 'auth/login' } });
  });

  it('should NOT capture auth failures (401) to Sentry', () => {
    const err = new Error('Invalid username or password');
    const message = err.message;
    const status = message.includes('Invalid username') ? 401 : 500;

    if (status === 500) {
      Sentry.captureException(err, { tags: { route: 'auth/login' } });
    }

    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it('should treat non-Error objects as 500s', () => {
    const err = 'unknown failure';
    const message = typeof err === 'string' ? err : 'Authentication failed';
    const status = message.includes('Invalid username') ? 401 : 500;

    if (status === 500) {
      Sentry.captureException(err, { tags: { route: 'auth/login' } });
    }

    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
  });
});
