import { describe, it, expect } from 'vitest';
import { refineHeadlinesWithNewKeyword } from '../app/api/get-suggestions/route';

describe('refineHeadlinesWithNewKeyword', () => {
  it('replaces existing keyword and removes colon when present', async () => {
    const headlines = ['OldKey: The quick brown fox'];
    const result = await refineHeadlinesWithNewKeyword(headlines, 'NewKey');
    expect(result).toEqual(['NewKey The quick brown fox']);
  });

  it('prepends keyword when no colon is present', async () => {
    const headlines = ['The quick brown fox'];
    const result = await refineHeadlinesWithNewKeyword(headlines, 'NewKey');
    expect(result).toEqual(['NewKey The quick brown fox']);
  });

  it('returns original headline if keyword already exists without colon', async () => {
    const headlines = ['NewKey and the quick brown fox'];
    const result = await refineHeadlinesWithNewKeyword(headlines, 'NewKey');
    expect(result).toEqual(['NewKey and the quick brown fox']);
  });
});
