import { niceboardConfig } from '@config/niceboard'
import { CategoryService } from '@services/niceboard/CategoryService'
import { logger } from '@utils'

const categories = [
  'General Practitioner (GP) / Family Medicine',
  'Internal Medicine',
  'Pediatrics', 
  'Obstetrics and Gynecology (OB/GYN)',
  'Surgery',
  'Cardiology',
  'Dermatology',
  'Oncology',
  'Psychiatry',
  'Neurology',
  'Radiology',
  'Anesthesiology',
  'Emergency Medicine',
  'Pathology',
  'Endocrinology',
  'Gastroenterology',
  'Pulmonology',
  'Nephrology',
  'Rheumatology',
  'Infectious Diseases',
  'Allergy and Immunology',
  'Urology',
  'Ophthalmology',
  'Otolaryngology (ENT)',
  'Physical Medicine and Rehabilitation (PM&R)',
  'Geriatrics',
  'Hematology',
  'Pain Management',
  'Sports Medicine',
  'Preventive Medicine',
  'Occupational Medicine',
  'Forensic Medicine',
  'Clinical Genetics',
  'Neonatology',
  'Critical Care Medicine',
  'Palliative Care',
  'Sleep Medicine',
  'Bariatric Medicine',
  'Interventional Cardiology',
  'Transplant Surgery'
]

async function createCategories() {
  const service = new CategoryService(niceboardConfig)

  try {
    logger.info('Starting category creation...')
    
    for (const category of categories) {
      try {
        const response = await service.createCategory(category)
        logger.info(`Created category: ${category} with ID: ${response}`)
      } catch (error) {
        logger.error(`Failed to create category: ${category}`, error)
      }
    }

    logger.info('Category creation completed')
  } catch (error) {
    logger.error('Failed to initialize category service', error)
    throw error
  }
}

createCategories()
