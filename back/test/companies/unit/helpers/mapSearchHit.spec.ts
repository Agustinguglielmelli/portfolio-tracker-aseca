import { mapSearchHit } from '../../../../src/companies/utils/helpers';

describe('mapSearchHit', () => {
  it('should extract name, ticker and cik', () => {
    const hit = {
      _source: {
        display_names: ['Apple Inc (AAPL) (CIK 0001)'],
        ciks: ['0001'],
      },
    };

    const result = mapSearchHit(hit);

    expect(result).toEqual({
      name: 'Apple Inc',
      ticker: 'AAPL',
      cik: '0001',
    });
  });

  it('should handle missing data', () => {
    const hit = { _source: {} };

    const result = mapSearchHit(hit);

    expect(result).toEqual({
      name: 'Desconocido',
      ticker: null,
      cik: null,
    });
  });
  it('should handle name without ticker or CIK format', () => {
    const hit = {
      _source: {
        display_names: ['Apple Inc'],
        ciks: ['0001'],
      },
    };

    const result = mapSearchHit(hit);

    expect(result).toEqual({
      name: 'Apple Inc',
      ticker: null,
      cik: '0001',
    });
  });
  it('should not extract ticker if format is invalid', () => {
    const hit = {
      _source: {
        display_names: ['Apple Inc (AAPL'],
        ciks: ['0001'],
      },
    };

    const result = mapSearchHit(hit);

    expect(result.ticker).toBeNull();
    expect(result.cik).toEqual('0001');
    expect(result.name).toBe('Apple Inc');
  });
  it('should handle empty ciks array', () => {
    const hit = {
      _source: {
        display_names: ['Apple Inc (AAPL) (CIK 0001)'],
        ciks: [],
      },
    };

    const result = mapSearchHit(hit);

    expect(result.cik).toBeNull();
  });
  it('should handle empty disply_names array', () => {
    const hit = {
      _source: {
        display_names: [],
        ciks: ['0001'],
      },
    };
    const result = mapSearchHit(hit);
    expect(result.name).toBe('Desconocido');
    expect(result.ticker).toBeNull();
    expect(result.cik).toBe('0001');
  });
  it('should trim whitespace from name', () => {
    const hit = {
      _source: {
        display_names: ['Apple Inc  (AAPL) (CIK 0001)'],
        ciks: ['0001'],
      },
    };
    const result = mapSearchHit(hit);
    expect(result.name).toBe('Apple Inc'); // sin espacios extra
    expect(result.ticker).toEqual('AAPL');
    expect(result.cik).toEqual('0001');
  });
});
