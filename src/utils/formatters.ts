// utils/formatters.ts
import { JobsPikrJob, JobsPikrTimeUnit } from '@localtypes/jobspikr'

export const formatters = {
  sanitizeDescription(job: JobsPikrJob): string {
    if (job.html_job_description) {
      return job.html_job_description
    }
    if (job.job_description) {
      return `<p>${job.job_description}</p>`
    }
    return '<p>No description provided</p>'
  },

  mapSalaryTimeframe(timeUnit?: JobsPikrTimeUnit): string | undefined {
    const mapping: Record<JobsPikrTimeUnit, string> = {
      yearly: 'annually',
      monthly: 'monthly',
      weekly: 'weekly',
      hourly: 'hourly',
      daily: 'weekly',
    }

    return timeUnit ? mapping[timeUnit] : undefined
  },

  getLocationKey(city?: string, state?: string, country?: string): string {
    return [city, state, country].filter(Boolean).join(', ').toLowerCase()
  },
}
