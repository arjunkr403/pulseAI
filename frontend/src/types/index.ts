export interface Metrics {
  cpu_usage: number
  rps: number
  latency_p95: number
  pod_status: string
  anomaly_detected: boolean
}

export interface ScanResult {
  suggested_fix: string
  metrics: Metrics
  anomaly_detected: boolean
  requires_approval: boolean
  thread_id: string
}

export interface ApprovalResult {
  status: 'executed' | 'rejected'
}

export interface Incident {
  id: number
  cpu_usage: number
  rps: number
  latency_p95: number
  pod_status: string
  suggested_fix: string
  approved: boolean
  executed: boolean
  created_at: string
}