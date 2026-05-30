import { uniqueByCik } from '../../../../src/companies/utils/helpers';

describe('uniqueByCik', () => {
  it('should return empty array for empty input', () => {
    expect(uniqueByCik([])).toEqual([]);
  });
  it('should remove duplicates by cik', () => {
    const input = [
      { name: 'Apple', cik: '1', ticker: 'AAPL' },
      { name: 'Apple duplicate', cik: '1', ticker: 'AAPL' },
      { name: 'Microsoft', cik: '2', ticker: 'MSFT' },
    ];

    const result = uniqueByCik(input);

    expect(result).toHaveLength(2);
  });

  it('should ignore null cik', () => {
    const input = [{ name: 'A', cik: null, ticker: null }];

    const result = uniqueByCik(input);

    expect(result).toEqual([]);
  });
  it('should ignore null cik and keep valid ones', () => {
    const input = [
      { name: 'A', cik: null, ticker: null },
      { name: 'B', cik: '1', ticker: 'B' },
      { name: 'C', cik: '2', ticker: 'C' },
    ];

    const result = uniqueByCik(input);

    expect(result).toEqual([
      { name: 'B', cik: '1', ticker: 'B' },
      { name: 'C', cik: '2', ticker: 'C' },
    ]);
  });
});
