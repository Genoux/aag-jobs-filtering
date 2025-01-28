// test/testMerge.ts
import { DataSerializer } from '@services/export/DataSerializer'
import path from 'path'

async function testMerge() {
  try {
    const date = '2025-01-27'
    const baseDir = path.join(process.cwd(), 'output', date)

    await DataSerializer.mergeJobData(
      baseDir,
      'test',
      'healthcarejobs'
    )

  } catch (error) {
    if (error instanceof Error) {
      console.error('Error during test merge:', error.message)
    } else {
      console.error('Error during test merge:', String(error))
    }
    process.exit(1)
  }
}

// Run test
testMerge()