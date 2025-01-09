// services/OutputService.ts
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import {
  DailySummary,
  ProcessedJob,
  QuerySummaryStats,
  SavedQueryResult,
} from '@localtypes/JobSearch';
import { JobsPikrJob } from '@localtypes/JobsPikr';

export class OutputService {
  private readonly baseOutputDir: string;

  constructor() {
    this.baseOutputDir = path.join(process.cwd(), 'output');
  }

  async saveResultsToCsv(
    results: Record<string, SavedQueryResult>,
  ): Promise<void> {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const dateDir = path.join(this.baseOutputDir, timestamp.split('T')[0]);
    fs.mkdirSync(dateDir, { recursive: true });

    const summary: DailySummary = {
      timestamp,
      queries: {},
      totalJobs: 0,
      queryCount: Object.keys(results).length,
    };

    for (const [queryName, result] of Object.entries(results)) {
      const stats = await this.processQueryResults(dateDir, queryName, result);
      summary.queries[queryName] = stats;
      summary.totalJobs += result.jobs.length;
    }

    fs.writeFileSync(
      path.join(dateDir, 'summary.json'),
      JSON.stringify(summary, null, 2),
    );

    this.printSummary(summary);
  }

  private prepareJobsForCsv(jobs: JobsPikrJob[]): ProcessedJob[] {
    return jobs.map((job) => ({
      title: job.job_title,
      company: job.company_name,
      city: job.city,
      state: job.state,
      country: job.country,
      job_type: job.job_type || 'Not specified',
      is_remote: job.is_remote ? 'Yes' : 'No',
      has_expired: job.has_expired,
      salary_min: job.inferred_salary_from,
      salary_max: job.inferred_salary_to,
      salary_currency: job.inferred_salary_currency,
      salary_period: job.inferred_salary_time_unit,
      apply_url: job.apply_url || 'n/a',
      contact_email: job.contact_email || 'n/a',
      post_date: job.post_date,
      original_url: job.url,
      category: job.category,
      description: job.html_job_description || job.job_description || 'No description provided',
    }));
  }

  private async processQueryResults(
    dateDir: string,
    queryName: string,
    result: SavedQueryResult,
  ): Promise<QuerySummaryStats> {
    if (result.jobs.length > 0) {
      const csvData = this.prepareJobsForCsv(result.jobs);
      fs.writeFileSync(
        path.join(dateDir, `${this.sanitizeFileName(queryName)}.csv`),
        stringify(csvData, { header: true }),
      );
    }

    return {
      name: result.query.name,
      description: result.query.description,
      jobCount: result.jobs.length,
      locations: this.summarizeLocations(result.jobs),
      jobTypes: this.summarizeJobTypes(result.jobs),
      remoteCount: result.jobs.filter((j) => j.is_remote).length,
      salaryStats: this.summarizeSalaries(result.jobs),
      expiredCount: result.jobs.filter((j) => j.has_expired).length,
    };
  }

  private printSummary(summary: DailySummary): void {
    console.log('\nJob Search Results Summary:');
    console.log('=========================');
    console.log(`Total Queries: ${summary.queryCount}`);
    console.log(`Total Jobs Found: ${summary.totalJobs}\n`);

    Object.entries(summary.queries).forEach(([name, stats]) => {
      console.log(`${stats.name}:`);
      console.log(`- Jobs Found: ${stats.jobCount}`);
      console.log(`- Remote Jobs: ${stats.remoteCount}`);
      if (stats.jobCount > 0) {
        console.log(`- File: ${this.sanitizeFileName(name)}.csv\n`);
      }
    });
  }

  private sanitizeFileName(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  }

  private summarizeLocations(jobs: JobsPikrJob[]): Record<string, number> {
    return jobs.reduce((acc, job) => {
      const location = job.country || 'Unknown';
      acc[location] = (acc[location] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private summarizeJobTypes(jobs: JobsPikrJob[]): Record<string, number> {
    return jobs.reduce((acc, job) => {
      const type = job.job_type || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private summarizeSalaries(jobs: JobsPikrJob[]) {
    const salaries = jobs.filter(
      (job) => job.inferred_salary_from || job.inferred_salary_to,
    );

    if (salaries.length === 0) return null;

    return {
      min: Math.min(...salaries.map((j) => j.inferred_salary_from || Infinity)),
      max: Math.max(...salaries.map((j) => j.inferred_salary_to || 0)),
      currency: salaries[0]?.inferred_salary_currency || 'Unknown',
      count: salaries.length,
    };
  }

  async readJobsFromCsv(filePath: string): Promise<JobsPikrJob[]> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
    });

    return records.map((record: any) => ({
      crawl_timestamp: new Date().toISOString(),
      url: record.original_url,
      job_title: record.title,
      company_name: record.company,
      post_date: record.post_date,
      job_board: 'manual_import',
      city: record.city,
      state: record.state,
      country: record.country,
      job_description: record.description,
      html_job_description: record.description,
      job_type: record.job_type as JobsPikrJob['job_type'],
      salary_offered: record.salary_min && record.salary_max
        ? `${record.salary_min}-${record.salary_max} ${record.salary_currency}`
        : undefined,
      contact_email: record.contact_email,
      apply_url: record.apply_url,
      is_remote: record.is_remote === 'Yes',
      inferred_salary_currency: record.salary_currency,
      inferred_salary_time_unit: record.salary_period,
      inferred_salary_from: record.salary_min
        ? Number(record.salary_min)
        : undefined,
      inferred_salary_to: record.salary_max
        ? Number(record.salary_max)
        : undefined,
    }));
  }
}