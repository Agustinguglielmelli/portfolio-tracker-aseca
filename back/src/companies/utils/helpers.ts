import {
  CompanySearchResult,
  Filing,
  FilingRaw,
  GaapData,
  SecSearchHit,
} from './types';

export function mapSearchHit(hit: SecSearchHit): CompanySearchResult {
  const rawName = hit._source.display_names?.[0] ?? 'Desconocido';
  const cik = hit._source.ciks?.[0] ?? null;

  let cleanName = rawName;
  let ticker: string | null = null;

  if (rawName !== 'Desconocido') {
    const tickerMatch = rawName.match(/\(([^)]+)\)\s*\(CIK/);
    if (tickerMatch) ticker = tickerMatch[1];

    const nameMatch = rawName.match(/^(.*?)\s*\(/);
    if (nameMatch) cleanName = nameMatch[1].trim();
  }

  return {
    name: cleanName,
    ticker,
    cik,
  };
}

export function uniqueByCik(
  items: CompanySearchResult[],
): CompanySearchResult[] {
  const seen = new Set<string>();
  const result: CompanySearchResult[] = [];

  for (const item of items) {
    if (!item.cik) continue;
    if (seen.has(item.cik)) continue;

    seen.add(item.cik);
    result.push(item);
  }

  return result;
}

export function getLatestValue(gaap: GaapData, concept: string): number | null {
  const data = gaap?.[concept];
  if (!data?.units) return null;

  const usd = data.units.USD;
  const usdShares = data.units['USD/shares'];

  const unitData = usd ?? usdShares;

  if (!unitData || unitData.length === 0) return null;

  const reports = unitData
    .filter((r) => r.end && r.val != null)
    .sort((a, b) => new Date(b.end).getTime() - new Date(a.end).getTime());
  return reports[0]?.val ?? null;
}

export function mapFilings(recent: FilingRaw): Filing[] {
  const filings: Filing[] = [];

  for (let i = 0; i < recent.form.length; i++) {
    const form = recent.form[i];

    if (form === '10-K' || form === '10-Q') {
      filings.push({
        date: recent.filingDate[i],
        type: form,
        accessionNumber: recent.accessionNumber[i],
      });
    }
  }

  return filings;
}

export function sortFilingsByDateDesc(filings: Filing[]): Filing[] {
  return [...filings].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export function extractHistory(gaap: GaapData, concept: string) {
  const data = gaap?.[concept];
  if (!data?.units) return [];

  const usd = data.units.USD;
  const usdShares = data.units['USD/shares'];

  const unitData = usd ?? usdShares;

  if (!unitData || unitData.length === 0) return [];

  const reports = unitData.filter(
    (r) => r.form === '10-Q' || r.form === '10-K',
  );

  const unique = new Map<string, any>();

  for (const r of reports) {
    unique.set(r.end, {
      date: r.end,
      value: r.val,
      form: r.form,
    });
  }

  return Array.from(unique.values())
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);
}
