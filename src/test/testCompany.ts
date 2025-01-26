// testCompany.ts
import { niceboardConfig } from '@config/niceboard'
import { CompanyService } from '@services/niceboard/CompanyService'

async function testCompanyService() {
  const service = new CompanyService(niceboardConfig)

  try {
    console.log('Fetching all companies...')
    const allCompanies = await service.fetchAllCompanies()

    const companyName = 'Test Company Name'
    console.log(`\nTesting get/create for company: ${companyName}`)
    const companyId = await service.getOrCreateCompany(companyName)
    console.log('Result:', { companyName, companyId })
  } catch (error) {
    console.error('Error:', error)
  }
}

testCompanyService()
