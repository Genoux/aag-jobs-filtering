// config/niceboard.ts
import { NiceboardConfig } from '../types/Niceboard';
import dotenv from 'dotenv';

dotenv.config();

export const niceboardConfig: NiceboardConfig = {
  apiBaseUrl: 'https://jobs.aag.health/api/v1',
  apiKey: process.env.NICEBOARD_API_KEY || '',
  defaultCompanyId: 1,
  defaultJobTypeId: 1,
  requestDelay: 500
};