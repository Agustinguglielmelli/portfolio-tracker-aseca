import { sortFilingsByDateDesc } from '../../../../src/companies/utils/helpers';

describe('sortFilingsByDateDesc', () => {
  it('should return empty array', () => {
    const result = sortFilingsByDateDesc([]);

    expect(result).toEqual([]);
  });
  it('should sort newest first', () => {
    const input = [
      { date: '2023-01-01', type: '10-K', accessionNumber: '1' },
      { date: '2024-01-01', type: '10-Q', accessionNumber: '2' },
    ];

    const result = sortFilingsByDateDesc(input as any);

    expect(result[0].date).toBe('2024-01-01');
  });
  it('should sort all items in descending order', () => {
    const input = [
      { date: '2022-01-01', type: '10-K', accessionNumber: '1' },
      { date: '2024-01-01', type: '10-Q', accessionNumber: '2' },
      { date: '2023-01-01', type: '10-K', accessionNumber: '3' },
    ];

    const result = sortFilingsByDateDesc(input as any);

    expect(result.map((r) => r.date)).toEqual([
      '2024-01-01',
      '2023-01-01',
      '2022-01-01',
    ]);
  });
  it('should handle equal dates', () => {
    const input = [
      { date: '2024-01-01', type: '10-K', accessionNumber: '1' },
      { date: '2024-01-01', type: '10-Q', accessionNumber: '2' },
    ];
    const result = sortFilingsByDateDesc(input as any);
    expect(result).toHaveLength(2);
  });
  it('should not mutate the original array', () => {
    const input = [
      { date: '2023-01-01', type: '10-K', accessionNumber: '1' },
      { date: '2024-01-01', type: '10-Q', accessionNumber: '2' },
    ];
    const original = [...input];
    sortFilingsByDateDesc(input as any);
    expect(input[0].date).toBe(original[0].date); // falla — el array fue mutado
  });
});
