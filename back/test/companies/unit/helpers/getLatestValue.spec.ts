import { getLatestValue } from '../../../../src/companies/utils/helpers';

describe('getLatestValue', () => {
  const gaap = {
    Revenues: {
      units: {
        USD: [
          { val: 100, end: '2023-01-01', frame: 'CY2023Q1' },
          { val: 200, end: '2024-01-01', frame: 'CY2024Q1' },
        ],
      },
    },
  };

  it('should return latest value', () => {
    const result = getLatestValue(gaap, 'Revenues');

    expect(result).toBe(200);
  });

  it('should fallback to USD/shares', () => {
    const gaap2 = {
      NetIncomeLoss: {
        units: {
          'USD/shares': [{ val: 50, end: '2024-01-01', frame: 'CY2024Q1' }],
        },
      },
    };

    const result = getLatestValue(gaap2, 'NetIncomeLoss');

    expect(result).toBe(50);
  });

  it('should return null if no data', () => {
    const result = getLatestValue({}, 'Revenues');

    expect(result).toBeNull();
  });
  it('should return null if concept has no units', () => {
    const gaap3 = { Revenues: {} }; // existe pero sin units
    expect(getLatestValue(gaap3, 'Revenues')).toBeNull();
  });
  it('should return null if USD array is empty', () => {
    const gaap4 = { Revenues: { units: { USD: [] } } };
    expect(getLatestValue(gaap4, 'Revenues')).toBeNull();
  });
  it('should ignore entries without val or end', () => {
    const gaap = {
      Revenues: {
        units: {
          USD: [
            { val: null, end: '2024-01-01' },
            { val: 100, end: null },
            { val: 200, end: '2023-01-01' },
          ],
        },
      },
    };
    expect(getLatestValue(gaap as any, 'Revenues')).toBe(200);
  });
});
