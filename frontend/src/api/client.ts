import axios from 'axios'
import type { Metrics, ScanResult, Incident, StructuredFix, FollowUpResponse } from '../types'

const BASE_URL = 'http://localhost:8000/api'

const api = axios.create({
  baseURL: BASE_URL,
})

api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

export const fetchMetrics = async (): Promise<Metrics> => {
  const res = await api.get('/metrics')
  return res.data
}

export const scanCluster = async (): Promise<ScanResult> => {
  const res = await api.post('/chat', {})
  return res.data
}

export const approveFix = async (
  thread_id: string,
  approved: boolean
): Promise<{ status: string; fix_result: string }> => {
  const res = await api.post('/approve', { thread_id, approved })
  return res.data
}

export const fetchIncidents = async (): Promise<Incident[]> => {
  const res = await api.get('/incidents')
  return res.data
}

export const sendFollowUp = async (
  message: string,
  thread_id: string
): Promise<FollowUpResponse> => {
  const res = await api.post('/followup', { message, thread_id })
  return res.data
}

export const parseFix = (suggested_fix: string): StructuredFix | null => {
  try {
    return JSON.parse(suggested_fix)
  } catch {
    return null
  }
}