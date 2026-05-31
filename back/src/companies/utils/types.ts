export interface SecSearchHit {
  _source: {
    display_names?: string[];
    ciks?: string[];
  };
}

export interface CompanySearchResult {
  name: string;
  ticker: string | null;
  cik: string | null;
}

export type GaapUnit = {
  val: number;
  end: string;
  form?: string;
  frame?: string;
};

export type GaapConcept = {
  units?: {
    USD?: GaapUnit[];
    'USD/shares'?: GaapUnit[];
  };
};

export type GaapData = Record<string, GaapConcept>;

export type FilingRaw = {
  filingDate: string[];
  form: string[];
  accessionNumber: string[];
};

export type Filing = {
  date: string;
  type: '10-K' | '10-Q';
  accessionNumber: string;
};
