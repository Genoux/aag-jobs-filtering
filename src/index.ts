// index.ts
import { Command } from 'commander'
import { JobSearchService } from './services/JobSearchService'
import { NiceboardService } from './services/niceboard/NiceboardService'
import { OutputService } from './services/OutputService'
import { CommandResult, FetchOptions, UploadOptions } from './types/CLI'

class JobProcessor {
  private readonly searchService: JobSearchService
  private readonly outputService: OutputService
  private readonly niceboardService: NiceboardService

  constructor() {
    this.searchService = new JobSearchService()
    this.outputService = new OutputService()
    this.niceboardService = new NiceboardService()
  }

  async fetchJobs(options: FetchOptions): Promise<CommandResult> {
    try {
      console.log('Fetching jobs from JobsPikr...')
      const jobResults = await this.searchService.processAllQueries()

      console.log('Saving results to CSV...')
      await this.outputService.saveResultsToCsv(jobResults)

      return {
        success: true,
        message:
          'Jobs fetched and saved successfully. Please review the CSV files before uploading to Niceboard.',
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
    file: string,
    options: UploadOptions,
  ): Promise<CommandResult> {
    try {
      console.log('Reading jobs from CSV...')
      const jobs = await this.outputService.readJobsFromCsv(file)

      if (options.dryRun) {
        return {
          success: true,
          message: 'Dry run completed successfully',
        }
      }

      console.log('Uploading jobs to Niceboard...')
      await this.niceboardService.processJobs(jobs)

      return {
        success: true,
        message: 'Jobs uploaded successfully',
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
    .option('-l, --limit <number>', 'number of jobs to fetch', '50')
    .action((options) => {
      handleCommand(
        processor.fetchJobs({
          limit: parseInt(options.limit),
        }),
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
