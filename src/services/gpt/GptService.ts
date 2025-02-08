import OpenAI from 'openai'
import { parse } from 'csv-parse/sync'
import fs from 'fs'
import path from 'path'
import { stringify } from 'csv-stringify/sync'

type Job = {
  job_title: string
  company_name: string
  city: string
  state: string
  job_type: string
  category: string
  uniq_id: string
}

export class GptService {
  private readonly csvOptions = {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    quote: '"',
    escape: '"',
    relax_column_count: true,
    trim: true,
    skip_records_with_error: true,
  }

  constructor(private readonly openai: OpenAI) {}

  private async getSystemPrompt(): Promise<string> {
    try {
      const promptPath = path.join(__dirname, 'systemPrompt.txt')
      return await fs.promises.readFile(promptPath, 'utf-8')
    } catch (error) {
      console.error('Error reading prompt file:', error)
      throw new Error('Failed to load system prompt')
    }
  }

  async standardizeJobData(csvContent: string): Promise<string> {
    try {
      const systemPrompt = await this.getSystemPrompt();
      const records = parse(csvContent, this.csvOptions) as Job[];
      
      const simplifiedRecords = records.map(record => ({
        job_title: record.job_title,
        company_name: record.company_name,
        city: record.city,
        state: record.state,
        job_type: record.job_type,
        category: record.category,
        uniq_id: record.uniq_id
      }));

      const chunkSize = 10;
      const chunks = [];
      for (let i = 0; i < simplifiedRecords.length; i += chunkSize) {
        chunks.push(simplifiedRecords.slice(i, i + chunkSize));
      }

      console.log(`Processing ${chunks.length} chunks of ${chunkSize} records each`);

      const processedChunks = await Promise.all(
        chunks.map(async (chunk, index) => {
          console.log(`Processing chunk ${index + 1}/${chunks.length}`);

          const chunkCsv = stringify(chunk, {
            header: true,
            columns: ['job_title', 'company_name', 'city', 'state', 'job_type', 'category', 'uniq_id']
          });

          const response = await this.openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: systemPrompt
              },
              {
                role: "user",
                content: chunkCsv
              }
            ],
            response_format: { type: "text" },
            temperature: 0.1,
            max_tokens: 4000
          });

          if (!response.choices[0].message.content) {
            throw new Error('No response from GPT')
          }

          const standardizedRows = parse(response.choices[0].message.content, {
            ...this.csvOptions,
            columns: true
          }) as Job[];

          return standardizedRows.map(row => ({
            job_title: row.job_title,
            category: row.category,
            uniq_id: row.uniq_id
          }));
        })
      );

      return stringify(processedChunks.flat(), {
        header: true,
        columns: ['job_title', 'category', 'uniq_id']
      });

    } catch (error) {
      console.error('Error in standardization:', error);
      throw error;
    }
  }
}