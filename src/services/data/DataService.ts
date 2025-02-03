// services/data/DataService.ts
import fs from 'fs'
import path from 'path'
import { stringify } from 'csv-stringify/sync'
import { parse } from 'csv-parse/sync'
import { QueryResult, QueryStats, Summary } from '@localtypes/query'
import { JobsPikrJob } from '@localtypes/job'
import { DataSerializer } from './DataSerializer'

export interface DataServiceOptions {
  outputDir: string
}

export class DataService {
  private readonly outputDir: string
  private readonly csvOptions = {
    columns: true,
    skip_empty_lines: false,
    relax_quotes: true,
    relax_column_count: true,
    quote: '"',
    escape: '"',
    quote_all: true,
  }

  constructor(options: DataServiceOptions) {
    this.outputDir = options.outputDir
  }

  async exportResults(results: Record<string, QueryResult>): Promise<void> {
    try {
      const dateDir = this.createDateDirectory()
      const summary = await this.processResults(results, dateDir)
      await this.saveSummary(dateDir, summary)
    } catch (error) {
      console.error('Export failed:', error)
      throw error
    }
  }

  async readCsvFiles(sourceName: string, targetName: string): Promise<[JobsPikrJob[], JobsPikrJob[]]> {
    try {
      const files = await Promise.all([
        fs.promises.readFile(path.join(this.outputDir, `${sourceName}.csv`), 'utf-8'),
        fs.promises.readFile(path.join(this.outputDir, `${targetName}.csv`), 'utf-8'),
      ])
      return files.map(file => parse(file, this.csvOptions)) as [JobsPikrJob[], JobsPikrJob[]]
    } catch (error) {
      console.error('Error reading CSV files:', error)
      throw error
    }
  }

  async saveStandardizedData(mainData: JobsPikrJob[], standardizedData: JobsPikrJob[]): Promise<void> {
    try {
      const updateMap = this.createUpdateMap(standardizedData)
      const mergedData = this.mergeDatas(mainData, updateMap)
      await this.writeCsv(path.join(this.outputDir, 'result.csv'), mergedData)
      console.log('Standardized data saved successfully')
    } catch (error) {
      console.error('Error saving standardized data:', error)
      throw error
    }
  }

  private createDateDirectory(): string {
    const timestamp = new Date().toISOString().split('T')[0]
    const dir = path.join(this.outputDir, timestamp)
    fs.mkdirSync(dir, { recursive: true })
    return dir
  }

  private async processResults(results: Record<string, QueryResult>, outputDir: string): Promise<Summary> {
    const summary = this.initializeSummary(results)

    for (const [queryName, result] of Object.entries(results)) {
      const stats = await this.saveQueryResults(outputDir, result)
      summary.queries[queryName] = stats
      summary.totalJobs += result.jobs.length
    }

    return summary
  }

  private initializeSummary(results: Record<string, QueryResult>): Summary {
    return {
      timestamp: new Date().toISOString(),
      queries: {},
      totalJobs: 0,
      queryCount: Object.keys(results).length,
    }
  }

  private async saveQueryResults(
    outputDir: string,
    result: QueryResult
  ): Promise<QueryStats> {
    if (result.jobs.length > 0) {
      await this.writeJobData(outputDir, result.jobs)
    }
    return DataSerializer.serializeStats(result)
  }

  private async writeJobData(outputDir: string, jobs: JobsPikrJob[]): Promise<void> {
    const fullData = jobs.map(DataSerializer.serializeFullJob)
    const simplifiedData = jobs.map(DataSerializer.serializeSimplifiedJob)
    await Promise.all([
      this.writeCsv(path.join(outputDir, 'data.csv'), fullData),
      this.writeCsv(path.join(outputDir, 'data_simplified.csv'), simplifiedData)
    ])
  }

  private createUpdateMap(sourceData: JobsPikrJob[]): Map<string | number, Partial<JobsPikrJob>> {
    return new Map(
      sourceData.map(row => [
        row.uniq_id,
        {
          job_title: row.job_title,
          category: row.category,
          company_name: row.company_name
        }
      ])
    )
  }

  private mergeDatas(targetData: JobsPikrJob[], updateMap: Map<string | number, Partial<JobsPikrJob>>): JobsPikrJob[] {
    return targetData.map((row: JobsPikrJob) => {
      const update = updateMap.get(row.uniq_id)
      return update ? {
        ...row,
        ...update,
        is_remote: row.is_remote,
      } : row
    })
  }

  private async writeCsv(filePath: string, data: object[]): Promise<void> {
    await fs.promises.writeFile(
      filePath,
      stringify(data, {
        header: true,
        quote: true,
        escape: '"',
        quoted: false
      })
    )
    console.log(`Data written to ${filePath}`)
  }

  private async saveSummary(outputDir: string, summary: Summary): Promise<void> {
    const filePath = path.join(outputDir, 'summary.json')
    await fs.promises.writeFile(filePath, JSON.stringify(summary, null, 2))
  }
}