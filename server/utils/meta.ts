import type { ApiMeta } from '~/types/api'

export function baseMeta(): ApiMeta {
  return {
    data_updated_at: {
      date: '2026-05-12',
      time: '09:21:00',
      datetime: '2026-05-12T09:21:00+05:30',
      timezone: 'IST',
    },
    market_label: 'US Market',
    source_files: {
      outstanding_signal: 'trade_store/US/2026-05-12_outstanding_signal.csv',
      combined_performance_report: 'trade_store/US/2026-05-12_combined_performance_report.csv',
    },
  }
}
