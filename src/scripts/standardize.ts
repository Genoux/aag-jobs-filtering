// scripts/standardize.ts
import { GptService } from '@services/gpt/GptService'
import { DataService } from '@services/data/DataService'
import OpenAI from 'openai'
import path from 'path'
import { stringify } from 'csv-stringify/sync'
import { parse } from 'csv-parse/sync'
import dotenv from 'dotenv'
import { logger } from '@utils'

dotenv.config()

async function standardizeJobs() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required')
  }

  const date = new Date().toISOString().split('T')[0]
  const outputDir = path.join(process.cwd(), 'output', date)
  
  const dataService = new DataService({
    outputDir
  })
  
  const gptService = new GptService(
    new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  )

  try {
    console.log('Starting job standardization process...')
    console.log(`Using output directory: ${outputDir}`)
    
    console.log('Reading CSV files...')
    const [mainData, simplifiedData] = await dataService.readCsvFiles('data', 'data_simplified')
    console.log(`Loaded ${mainData.length} main records and ${simplifiedData.length} simplified records`)

    console.log('Processing data through GPT...')
    const standardizedContent = await gptService.standardizeJobData(
      stringify(simplifiedData, { header: true, quote: false })
    )
    console.log('GPT processing complete')
    
    console.log('Saving standardized data...')
    const standardizedData = parse(standardizedContent, { columns: true, relax_column_count: true })
    logger.info('Standardized data', { standardizedData })
    await dataService.saveStandardizedData(mainData, standardizedData)
    
    console.log('Job standardization completed successfully')
  } catch (error) {
    console.error('Error in standardization process:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  standardizeJobs()
}

export { standardizeJobs }