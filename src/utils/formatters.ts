// utils/formatters.ts
import { JobsPikrJob } from '@localtypes/job'

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

  getLocationKey(city?: string, state?: string, country?: string): string {
    return [city, state, country].filter(Boolean).join(', ').toLowerCase()
  },
}
