// testJobType.ts
import { niceboardConfig } from '@config/niceboard'
import { JobTypeService } from '@services/niceboard/JobTypeService'

async function testJobTypeService() {
  const service = new JobTypeService(niceboardConfig)

  try {
    console.log('Fetching all job types...')
    const allJobTypes = await service.fetchAllJobTypes()

    const jobTypeName = 'Contract'
    console.log(`\nTesting get/create for job type: ${jobTypeName}`)
    const jobTypeId = await service.getJobTypeId(jobTypeName)
    console.log('Result:', { jobTypeName, jobTypeId })

    const unknownJobType = 'Unknown Job Type'
    console.log(`\nTesting get/create for job type: ${unknownJobType}`)
    const unknownJobTypeId = await service.getJobTypeId(unknownJobType)
    console.log('Result:', { unknownJobType, unknownJobTypeId })
  } catch (error) {
    console.error('Error:', error)
  }
}

testJobTypeService()
