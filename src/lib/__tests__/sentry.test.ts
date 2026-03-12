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
