import { GptService } from '@services/gpt/GptService'
import { DataService } from '@services/data/DataService'
import OpenAI from 'openai'
import path from 'path'
import dotenv from 'dotenv'
import { logger } from '@utils'

dotenv.config()

export async function standardizeJobs() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required')
  }

  const outputDir = path.join(
    process.env.VERCEL ? '/tmp' : process.cwd(), 
    'output',
    new Date().toISOString().split('T')[0]
  )

  const dataService = new DataService({ outputDir })
  const gptService = new GptService(
    new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  )

  try {
    console.log('Starting job standardization process...')
    console.log(`Using output directory: ${outputDir}`)

    const [mainData] = await dataService.readCsvFiles('data', 'data')
    console.log(`Loaded ${mainData.length} records`)

    const standardizedData = await gptService.standardizeJobData(mainData)
    logger.info('Standardized data', { standardizedData })

    await dataService.saveStandardizedData(mainData, standardizedData)
    console.log('Job standardization completed successfully')
  } catch (error) {
    console.error('Error in standardization process:', error)
    throw error
  }
}

if (require.main === module) {
  standardizeJobs()
}