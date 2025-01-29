// index.ts
import { Command } from 'commander'
import path from 'path'
import { parse } from 'csv-parse/sync'
import fs from 'fs'
import { niceboardConfig } from '@config/niceboard'
import { DataService } from '@services/data/DataService'
import { JobSearchService } from '@services/jobSearch/JobSearchService'
import { CompanyService } from '@services/niceboard/CompanyService'
import { NiceboardService } from '@services/niceboard/NiceboardService'
import { CommandResult } from '@localtypes/config'

type UploadOptions = {
  dryRun: boolean
}

class JobProcessor {
  private readonly searchService: JobSearchService
  private readonly exportService: DataService
  private readonly niceboardService: NiceboardService
  public readonly companyService: CompanyService

  constructor() {
    this.searchService = new JobSearchService()
    this.exportService = new DataService({
      outputDir: path.join(process.cwd(), 'output'),
    })
    this.niceboardService = new NiceboardService()
    this.companyService = new CompanyService(niceboardConfig)
  }

  async fetchJobs(): Promise<CommandResult> {
    try {
      console.log('Fetching jobs from JobsPikr...')
      const jobResults = await this.searchService.processAllQueries()

      console.log('Saving results to CSV...')
      await this.exportService.exportResults(jobResults)

      return {
        success: true,
        message: 'Jobs fetched and saved successfully. Please review the CSV files before uploading to Niceboard.',
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch and save jobs',
        error: error instanceof Error ? error : new Error('Unknown error'),
      }
    }
  }

  async uploadJobs(
    filePath: string,
    options: UploadOptions,
  ): Promise<CommandResult> {
    try {
      const csvContent = await fs.promises.readFile(filePath, 'utf-8')
      const jobs = parse(csvContent, { columns: true })

      if (options.dryRun) {
        return {
          success: true,
          message: `Dry run completed successfully. Would process ${jobs.length} jobs.`,
        }
      }

      const stats = await this.niceboardService.processJobs(jobs)

      return {
        success: true,
        message: `Jobs processed successfully:
          Total: ${stats.total}
          Created: ${stats.created}
          Skipped: ${stats.skipped}
          Failed: ${stats.failed}`,
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to upload jobs',
        error: error instanceof Error ? error : new Error('Unknown error'),
      }
    }
  }
}

async function handleCommand(action: Promise<CommandResult>): Promise<void> {
  try {
    const result = await action
    if (result.success) {
      console.log(result.message)
    } else {
      console.error(result.message)
      console.error(result.error)
      process.exit(1)
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    process.exit(1)
  }
}

function main() {
  const processor = new JobProcessor()
  const program = new Command()

  program
    .name('job-processor')
    .description('CLI to manage jobs between JobsPikr and Niceboard')

  program
    .command('fetch')
    .description('Fetch jobs from JobsPikr and save to CSV')
    .action(() => {
      handleCommand(
        processor.fetchJobs(),
      )
    })

  program
    .command('upload')
    .description('Upload jobs from CSV to Niceboard')
    .argument('<file>', 'CSV file to upload')
    .option(
      '-d, --dry-run',
      'Show what would be uploaded without actually uploading',
      false,
    )
    .action((file, options) => {
      handleCommand(
        processor.uploadJobs(file, {
          dryRun: options.dryRun,
        }),
      )
    })

  program.parse()
}

main()