export interface Company {
  ticker: string
  cik: string
  name: string
}

export interface Filing {
  type: string
  date: string
  desc: string
}

export interface CompanyFact {
  label: string
  value: string
}
