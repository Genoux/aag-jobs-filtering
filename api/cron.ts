// api/cron.ts
import path from 'path'
import moduleAlias from 'module-alias'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { logger } from '../src/utils'

moduleAlias.addAliases({
  '@config': path.join(process.cwd(), 'dist/src/config'),
  '@services': path.join(process.cwd(), 'dist/src/services'),
  '@localtypes': path.join(process.cwd(), 'dist/src/types'),
  '@queries': path.join(process.cwd(), 'dist/src/queries'),
  '@utils': path.join(process.cwd(), 'dist/src/utils'),
  '@constants': path.join(process.cwd(), 'dist/src/constants'),
  '@interfaces': path.join(process.cwd(), 'dist/src/interfaces')
})
import { JobProcessor } from '../src/main'

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  const authHeader = request.headers['authorization'];
  if (
    !process.env.CRON_SECRET ||
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return response.status(401).json({ success: false, message: 'Unauthorized' });
  }

  // Get week number (1-52)
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const weekNumber = Math.ceil((now.getTime() - startOfYear.getTime()) / (7 * 24 * 60 * 60 * 1000))

  // Skip if not an odd week
  if (weekNumber % 2 === 0) {
    logger.info('Skipping - even week')
    return response.status(200).json({ success: true, message: 'Skipping - even week' })
  }

  // Run the job
  try {
    const processor = new JobProcessor()
    const result = await processor.runPipeline()
    if (!result.success) {
      throw new Error(result.message)
    }
    return response.status(200).json({ success: true })
  } catch (error) {
    logger.error('Pipeline failed:', error)
    return response.status(500).json({
      success: false
    })
  }
}