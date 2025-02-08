import { JobProcessor } from '../src/index'
import { GptService } from '@services/gpt/GptService'
import { DataService } from '@services/data/DataService'
import OpenAI from 'openai'
import path from 'path'
import { stringify } from 'csv-stringify/sync'
import { parse } from 'csv-parse/sync'

async function runJobPipeline() {
  try {
    // Use /tmp for Vercel serverless environment
    const outputDir = '/tmp'
    const dateDir = path.join(outputDir, new Date().toISOString().split('T')[0])
    
    const processor = new JobProcessor()
    const dataService = new DataService({ outputDir: dateDir })
    const gptService = new GptService(
      new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    )

    // 1. Fetch jobs
    console.log('Starting job fetch...')
    const fetchResult = await processor.fetchJobs()
    if (!fetchResult.success) {
      throw new Error(`Fetch failed: ${fetchResult.message}`)
    }

    // 2. Standardize
    console.log('Starting standardization...')
    const [mainData] = await dataService.readCsvFiles('data', 'data')

    // Extract only needed fields for GPT
    const gptInput = mainData.map(record => ({
      job_title: record.job_title,
      company_name: record.company_name,
      city: record.city,
      state: record.state,
      job_type: record.job_type,
      category: record.category,
      uniq_id: record.uniq_id
    }));

    // Process through GPT
    const standardizedContent = await gptService.standardizeJobData(
      stringify(gptInput, {
        header: true,
        columns: ['job_title', 'company_name', 'city', 'state', 'job_type', 'category', 'uniq_id']
      })
    )

    // Parse and save standardized data
    const standardizedData = parse(standardizedContent, { columns: true })
    await dataService.saveStandardizedData(mainData, standardizedData)

    // 3. Upload
    console.log('Starting upload...')
    const uploadResult = await processor.uploadJobs(
      path.join(dateDir, 'result.csv'),
      { dryRun: false }
    )
    if (!uploadResult.success) {
      throw new Error(`Upload failed: ${uploadResult.message}`)
    }

    return new Response('Job pipeline completed successfully', { status: 200 })
  } catch (error: unknown) {
    console.error('Pipeline failed:', error)
    if (error instanceof Error) {
      return new Response(`Pipeline failed: ${error.message}`, { status: 500 })
    }
    return new Response('Pipeline failed: Unknown error', { status: 500 })
  }
}

export async function handler(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }
  return runJobPipeline()
}

export default handler