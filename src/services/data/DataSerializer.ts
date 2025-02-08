import { JobsPikrJob } from '@localtypes/job'
import { QueryResult, QueryStats } from '@localtypes/query'

export class DataSerializer {
  static serializeFullJob(job: JobsPikrJob) {
    return {
      job_title: job.job_title,
      company_name: job.company_name,
      city: job.city,
      state: job.state,
      country: job.country,
      job_type: job.job_type,
      category: job.category,
      is_remote: job.is_remote ? 'true' : 'false',
      uniq_id: job.uniq_id,
      description: job.html_job_description || job.job_description,
      apply_url: job.apply_url,
      contact_email: job.contact_email,
      post_date: job.post_date,
    }
  }

  // static serializeSimplifiedJob(job: JobsPikrJob): Record<string, string> {
  //   const { job_title, category } = job
  //   return {
  //     job_title,
  //     company_name: job.company_name,
  //     city: job.city,
  //     state: job.state,
  //     country: job.country,
  //     job_type: job.job_type,
  //     category: job.category,
  //     uniq_id: job.uniq_id.toString(),
  //   }
  // }

  static serializeStats(result: QueryResult): QueryStats {
    const { jobs, query } = result
    return {
      name: query.name,
      description: query.description,
      jobCount: jobs.length,
      remoteCount: jobs.filter(j => j.is_remote).length,
      expiredCount: jobs.filter(j => j.has_expired).length,
    }
  }
}