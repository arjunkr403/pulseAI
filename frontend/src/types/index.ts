export interface Metrics {
  cpu_usage: number
  rps: number
  latency_p95: number
  pod_status: string
  anomaly_detected: boolean
}

export interface StructuredFix {
  anomaly_reason: string
  root_cause: string
  kubectl_command: string
  action: string
}

export interface FollowUpResponse {
  response: string
  thread_id: string
}

export interface ScanResult {
  suggested_fix: string
  fix_type: string
  fix_result: string
  metrics: Metrics
  anomaly_detected: boolean
  requires_approval: boolean
  thread_id: string
}

export interface ApprovalResult {
  status: 'executed' | 'rejected'
  fix_result: string
}

export interface Incident {
  id: number
  cpu_usage: number
  rps: number
  latency_p95: number
  pod_status: string
  suggested_fix: string
  fix_type: string
  fix_result: string
  approved: boolean
  executed: boolean
  created_at: string
}