// testCategory.ts
import { niceboardConfig } from '@config/niceboard'
import { CategoryService } from '@services/niceboard/CategoryService'

async function testCategoryService() {
  const service = new CategoryService(niceboardConfig)

  try {
    // Test single category
    const singleCategory = 'Healthcare'
    console.log('\n--- Testing single category ---')
    console.log('Input:', singleCategory)
    const categoryId = await service.getCategoryId(singleCategory)
    console.log('Output:', { 
      category: singleCategory, 
      id: categoryId,
      note: categoryId === 43904 ? '(Default "Other" category - 43904)' : ''
    })

    // Test compound category with multiple options
    const compoundCategory = 'Healthcare, social assistance'
    console.log('\n--- Testing compound category ---')
    console.log('Input:', compoundCategory)
    const compoundCategoryId = await service.getCategoryId(compoundCategory)
    console.log('Output:', { 
      category: compoundCategory,
      id: compoundCategoryId,
      note: compoundCategoryId === 43904 ? '(Default "Other" category - 43904)' : ''
    })

    // Test category with 'and'
    const categoryWithAnd = 'Research, Analyst, and Information Technology'
    console.log('\n--- Testing category with "and" ---')
    console.log('Input:', categoryWithAnd)
    const categoryWithAndId = await service.getCategoryId(categoryWithAnd)
    console.log('Output:', { 
      category: categoryWithAnd,
      id: categoryWithAndId,
      note: categoryWithAndId === 43904 ? '(Default "Other" category - 43904)' : ''
    })

    // Test unknown category
    const unknownCategory = 'Completely Unknown Category Type'
    console.log('\n--- Testing unknown category ---')
    console.log('Input:', unknownCategory)
    const unknownCategoryId = await service.getCategoryId(unknownCategory)
    console.log('Output:', { 
      category: unknownCategory,
      id: categoryId,
      note: unknownCategoryId === 43904 ? '(Default "Other" category - 43904)' : ''
    })

  } catch (error) {
    console.error('Error:', error)
  }
}

testCategoryService()