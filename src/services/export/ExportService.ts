// services/export/ExportService.ts
import fs from 'fs'
import path from 'path'
import { stringify } from 'csv-stringify/sync'
import { QueryResult, QueryStats, Summary } from '@localtypes/query'
import { DataSerializer } from './DataSerializer'

export interface ExportOptions {
  outputDir: string
}

export class ExportService {
  private readonly outputDir: string

  constructor(options: ExportOptions) {
    this.outputDir = options.outputDir
  }

  async exportResults(results: Record<string, QueryResult>): Promise<void> {
    try {
      const dateDir = this.createOutputDirectory()
      const summary = await this.processResults(results, dateDir)
      await this.saveSummary(dateDir, summary)
    } catch (error) {
      console.error('Export failed:', error)
      throw error
    }
  }

  private createOutputDirectory(): string {
    const timestamp = new Date().toISOString().split('T')[0]
    const dir = path.join(this.outputDir, timestamp)
    fs.mkdirSync(dir, { recursive: true })
    return dir
  }

  private async processResults(
    results: Record<string, QueryResult>,
    outputDir: string
  ): Promise<Summary> {
    const summary: Summary = {
      timestamp: new Date().toISOString(),
      queries: {},
      totalJobs: 0,
      queryCount: Object.keys(results).length,
    }
    // Log results for debugging without jobs
    console.log('Results:', Object.entries(results).map(([queryName, result]) => ({
      queryName,
      jobCount: result.jobs.length,
      totalFound: result.stats.totalFound,
      returned: result.stats.returned,
      searchDate: result.stats.searchDate,
    })))
    
    for (const [queryName, result] of Object.entries(results)) {
      const stats = await this.saveQueryResults(outputDir, queryName, result)
      summary.queries[queryName] = stats
      summary.totalJobs += result.jobs.length
    }

    return summary
  }

  private async saveQueryResults(
    outputDir: string,
    queryName: string,
    result: QueryResult
  ): Promise<QueryStats> {
    if (result.jobs.length > 0) {
      const fileName = this.sanitizeFileName(queryName)
      const fullData = result.jobs.map(DataSerializer.serializeFullJob)
      const simplifiedData = result.jobs.map(DataSerializer.serializeSimplifiedJob)

      await Promise.all([
        this.writeCsv(path.join(outputDir, `${fileName}.csv`), fullData),
        this.writeCsv(path.join(outputDir, `${fileName}_simplified.csv`), simplifiedData)
      ])
    }

    return DataSerializer.serializeStats(result)
  }

  private async writeCsv(filePath: string, data: Record<string, unknown>[]): Promise<void> {
    await fs.promises.writeFile(filePath, stringify(data, { header: true }))
  }

  private async saveSummary(outputDir: string, summary: Summary): Promise<void> {
    const filePath = path.join(outputDir, 'summary.json')
    await fs.promises.writeFile(filePath, JSON.stringify(summary, null, 2))
  }

  private sanitizeFileName(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '_')
  }
}