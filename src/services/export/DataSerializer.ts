import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'
import { stringify } from 'csv-stringify/sync'
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

  static serializeSimplifiedJob(job: JobsPikrJob): Record<string, string> {
    return {
      job_title: job.job_title,
      company_name: job.company_name,
      city: job.city,
      state: job.state,
      country: job.country,
      job_type: job.job_type,
      category: job.category,
      uniq_id: job.uniq_id.toString(),
    }
  }

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

  static async mergeJobData(sourceDir: string, sourceName: string, targetName: string): Promise<void> {
    const csvOptions = {
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
    }

    try {
      const [sourceData, targetData] = await Promise.all([
        fs.promises.readFile(path.join(sourceDir, `${sourceName}.csv`), 'utf-8'),
        fs.promises.readFile(path.join(sourceDir, `${targetName}.csv`), 'utf-8'),
      ].map(async (filePromise) => parse(await filePromise, csvOptions)));

      const updateMap = new Map(
        sourceData.map((row: JobsPikrJob) => [
          row.uniq_id,
          {
            job_title: row.job_title,
            category: row.category,
            company_name: row.company_name
          }
        ])
      );

      const mergedData = targetData.map((row: JobsPikrJob) => {
        const update = updateMap.get(row.uniq_id);
        return update ? {
          ...row,
          ...update,
          is_remote: row.is_remote ? 'true' : 'false'
        } : row;
      });

      await fs.promises.writeFile(
        path.join(sourceDir, 'result.csv'),
        stringify(mergedData, { header: true, quote: false })
      );

      console.log(`Merged data written to ${path.join(sourceDir, 'result.csv')}`);
    } catch (error) {
      console.error('Error merging job data:', error);
      throw error;
    }
  }
}