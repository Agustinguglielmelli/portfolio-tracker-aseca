import { mapFilings } from '../../../../src/companies/utils/helpers';

describe('mapFilings', () => {
  it('should return empty array when no filings exist', () => {
    const recent = {
      form: [],
      filingDate: [],
      accessionNumber: [],
    };

    const result = mapFilings(recent);

    expect(result).toEqual([]);
  });

  it('should map only 10-K and 10-Q', () => {
    const recent = {
      form: ['8-K', '10-K', '10-Q'],
      filingDate: ['a', 'b', 'c'],
      accessionNumber: ['1', '2', '3'],
    };

    const result = mapFilings(recent);

    expect(result).toEqual([
      {
        date: 'b',
        type: '10-K',
        accessionNumber: '2',
      },
      {
        date: 'c',
        type: '10-Q',
        accessionNumber: '3',
      },
    ]);
  });

  it('should return empty array when no 10-K or 10-Q', () => {
    const recent = {
      form: ['8-K', 'S-1'],
      filingDate: ['a', 'b'],
      accessionNumber: ['1', '2'],
    };

    const result = mapFilings(recent);

    expect(result).toEqual([]);
  });

  it('should preserve input order', () => {
    const recent = {
      form: ['10-Q', '10-K'],
      filingDate: ['2024', '2023'],
      accessionNumber: ['1', '2'],
    };

    const result = mapFilings(recent);

    expect(result[0].type).toBe('10-Q');
    expect(result[1].type).toBe('10-K');
  });
});
