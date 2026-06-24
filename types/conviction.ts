import type { ApiDataSource } from '~/types/api'

export type ConvictionVerdict =
  | 'MAX CONVICTION'
  | 'TACTICAL'
  | 'REDUCED'
  | 'CANCEL'
  | 'YIELD TRAP'
  | 'N/A (ETF)'

export type FsClass = 'strong' | 'moderate_high' | 'moderate' | 'moderate_low' | 'weak'
export type FdDirection = 'positive' | 'negative' | 'stable'
export type BusinessType = 'compounder' | 'saas' | 'income' | 'cyclical'

export interface BqDimension {
  name: string
  score: number
  source: string
}

export interface FdVote {
  label: string
  direction: 'positive' | 'negative' | 'stable'
  rationale?: string
}

export interface ConvictionSignalDetail {
  ticker: string
  businessType: string
  bq: number
  tax: number
  conviction: number
  fsClass: FsClass
  fdDirection: FdDirection
  yieldTrap: boolean
  dimensions: BqDimension[]
  oey: number
  oeyFloorLabel: string
  pe: number
  pePercentile: number
  fdVotes: FdVote[]
  fdSummary: string
  taxNote: string
  verdictNote: string
}

export interface ConvictionSignalRow {
  id: string
  ticker: string
  direction: 'LONG' | 'SHORT'
  function: string
  signalDate: string
  convictionScore: number | null
  verdict: ConvictionVerdict
  sizeModifier: string
  bqScore: number | null
  fsClass: FsClass | null
  fdDirection: FdDirection | null
  yieldTrap: boolean
  isEquity: boolean
  detail?: ConvictionSignalDetail
}

export interface ConvictionPortfolioCard {
  ticker: string
  name: string
  businessType: BusinessType
  mtm: string
  mtmPositive: boolean
  convictionScore: number
  verdict: ConvictionVerdict
  borderClass: 'hold' | 'monitor' | 'review'
  actionNote: string
  actionColor: string
}

export interface ConvictionContradiction {
  id: string
  kind: 'warning' | 'info'
  ticker: string
  body: string
}

export interface ConvictionHealth {
  breakdown: {
    max: { count: number; pct: number }
    tactical: { count: number; pct: number }
    reduced: { count: number; pct: number }
    cancel: { count: number; pct: number }
  }
  yieldTraps: number
  yieldTrapTickers: string[]
  avgConviction: number
  avgRange: { min: number; max: number }
  businessTypes: Array<{ type: BusinessType; count: number; color: string }>
  equityCount: number
}

export interface ConvictionResponse {
  data_source?: ApiDataSource
  asOf: string
  storeLive: boolean
  health: ConvictionHealth
  signals: ConvictionSignalRow[]
  portfolio: ConvictionPortfolioCard[]
  contradictions: ConvictionContradiction[]
}
