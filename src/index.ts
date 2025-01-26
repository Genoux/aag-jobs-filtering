// index.ts
import { Command } from 'commander'
import { niceboardConfig } from '@config/niceboard'
import { CommandResult, FetchOptions, UploadOptions } from '@localtypes/common'
import { CsvService } from './services/csv/CsvService'
import { JobSearchService } from './services/jobSearch/JobSearchService'
import { CompanyService } from './services/niceboard/CompanyService'
import { NiceboardService } from './services/niceboard/NiceboardService'

class JobProcessor {
  private readonly searchService: JobSearchService
  private readonly csvService: CsvService
  private readonly niceboardService: NiceboardService
  public readonly companyService: CompanyService
  constructor() {
    this.searchService = new JobSearchService()
    this.csvService = new CsvService()
    this.niceboardService = new NiceboardService()
    this.companyService = new CompanyService(niceboardConfig)
  }

  async fetchJobs(options: FetchOptions): Promise<CommandResult> {
    try {
      console.log('Fetching jobs from JobsPikr...')
      const jobResults = await this.searchService.processAllQueries()
      // map result so we remove the description field and the html_job_description

      console.log('Saving results to CSV...')
      await this.csvService.saveResultsToCsv(jobResults)

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
      const jobs = await this.csvService.readJobsFromCsv(file)

      if (options.dryRun) {
        return {
          success: true,
          message: 'Dry run completed successfully',
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

async function removeAllCompanies(
  processor: JobProcessor,
): Promise<CommandResult> {
  try {
    await processor.companyService.fetchAllCompanies()
    const companies = await processor.companyService.fetchAllCompanies()
    for (const company of companies) {
      await processor.companyService.removeCompany(company[1])
    }
    return { success: true, message: 'All companies removed successfully' }
  } catch (error) {
    return {
      success: false,
      message: 'Failed to remove companies',
      error: error instanceof Error ? error : new Error('Unknown error'),
    }
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

  program
    .command('remove-all-companies')
    .description('Remove all companies from Niceboard')
    .action(() => {
      handleCommand(removeAllCompanies(processor))
    })

  program.parse()
}

main()
