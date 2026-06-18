import { extractHistory } from '../../../../src/companies/utils/helpers';

describe('extractHistory', () => {
  const gaap = {
    Revenues: {
      units: {
        USD: [
          { val: 100, end: '2023-01-01', form: '10-K' },
          { val: 200, end: '2024-01-01', form: '10-Q' },
          { val: 300, end: '2024-01-01', form: '10-Q' },
        ],
      },
    },
  };
  it('should fallback to empty array', () => {
    const result = extractHistory({}, 'Revenues');

    expect(result).toEqual([]);
  });
  it('should return ordered unique history', () => {
    const result = extractHistory(gaap, 'Revenues');

    expect(result.length).toBeLessThanOrEqual(8);
    expect(result[0].date).toBe('2024-01-01');
  });
  it('should remove duplicates by date', () => {
    const gaap = {
      Revenues: {
        units: {
          USD: [
            { val: 100, end: '2024-01-01', form: '10-K' },
            { val: 200, end: '2024-01-01', form: '10-Q' },
          ],
        },
      },
    };

    const result = extractHistory(gaap, 'Revenues');

    expect(result).toHaveLength(1);
    expect(result[0].value).toBeDefined();
  });
});
