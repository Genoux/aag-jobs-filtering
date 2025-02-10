import { JobProcessor } from '../../main'

async function testCron() {
  console.log('Starting cron job test...')
  const startTime = Date.now()

  try {
    const processor = new JobProcessor()
    const result = await processor.runPipeline()
    
    const endTime = Date.now()
    const duration = (endTime - startTime) / 1000

    console.log('Result:', result)
    console.log(`Total execution time: ${duration} seconds`)
  } catch (error) {
    console.error('Error:', error)
    const endTime = Date.now()
    const duration = (endTime - startTime) / 1000
    console.log(`Failed after ${duration} seconds`)
  }
}

testCron().catch(console.error)