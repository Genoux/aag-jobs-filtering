// config/jobspikr.ts
import dotenv from 'dotenv';

dotenv.config();

export const jobspikrConfig = {
  API_BASE_URL: 'https://api.jobspikr.com/v2',
  headers: {
    'Content-Type': 'application/json',
    'client_id': process.env.JOBSPIKR_CLIENT_ID || '',
    'client_auth_key': process.env.JOBSPIKR_AUTH_KEY || ''
  }
};