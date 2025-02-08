import handler  from '../../../api/cron'

async function testCron() {
  console.log('Starting cron job test...')
  const startTime = Date.now()

  try {
    const mockRequest = new Request('http://localhost:3000/api/cron', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`
      }
    })

    const response = await handler(mockRequest)
    const responseText = await response.text()
    
    const endTime = Date.now()
    const duration = (endTime - startTime) / 1000

    console.log('Status:', response.status)
    console.log('Response:', responseText)
    console.log(`Total execution time: ${duration} seconds`)
  } catch (error) {
    console.error('Error:', error)
    const endTime = Date.now()
    const duration = (endTime - startTime) / 1000
    console.log(`Failed after ${duration} seconds`)
  }
}

testCron().catch(console.error)