import { niceboardConfig } from '@config/niceboard'
import { CompanyService } from '@services/niceboard/CompanyService'
import { logger } from '@utils'

async function main() {
  try {
    const companyService = new CompanyService(niceboardConfig)
    
    logger.info('Fetching all companies...')
    const companies = await companyService.fetchAllCompanies()
    
    logger.info(`Found ${companies.size} companies to remove`)
    
    for (const [companyName, companyId] of companies) {
      try {
        logger.info(`Removing company "${companyName}" (ID: ${companyId})`)
        await companyService.removeCompany(companyId)
      } catch (error) {
        logger.error(`Failed to remove company "${companyName}"`, error)
      }
    }

    logger.info('Finished removing companies')
  } catch (error) {
    logger.error('Failed to execute company removal script', error)
    process.exit(1)
  }
}

main()
