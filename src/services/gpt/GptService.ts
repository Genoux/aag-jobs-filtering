// services/gpt/GptService.ts
import OpenAI from 'openai'
import { parse } from 'csv-parse/sync'
import fs from 'fs'
import path from 'path'
import { stringify } from 'csv-stringify/sync'
import { JobsPikrJob } from '@localtypes/job'

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

  private readonly jobColumns = [
    'job_title', 'company_name', 'city', 'state', 
    'country', 'job_type', 'category', 'uniq_id'
  ] as const;

  constructor(private readonly openai: OpenAI) {}

  private async getSystemPrompt(): Promise<string> {
    try {
      return await fs.promises.readFile(
        path.join(__dirname, 'systemPrompt.txt'), 
        'utf-8'
      )
    } catch (error) {
      console.error('Error reading prompt file:', error)
      throw new Error('Failed to load system prompt')
    }
  }

  private async processChunk(chunk: JobsPikrJob[], systemPrompt: string, chunkIndex: number, totalChunks: number): Promise<JobsPikrJob[]> {
    console.log(`Processing chunk ${chunkIndex + 1}/${totalChunks}`);
    
    // Only send necessary fields to GPT
    const simplifiedChunk = chunk.map(job => ({
      job_title: job.job_title,
      company_name: job.company_name,
      city: job.city,
      state: job.state,
      country: job.country,
      job_type: job.job_type,
      category: job.category,
      uniq_id: job.uniq_id.toString()
    }));

    const chunkCsv = stringify(simplifiedChunk, {
      header: true,
      columns: this.jobColumns
    });

    const response = await this.openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: chunkCsv }
      ],
      response_format: { type: "text" },
      temperature: 0.1,
      max_tokens: 4000
    });

    if (!response.choices[0].message.content) {
      throw new Error('No response from GPT');
    }

    const standardizedRows = parse(response.choices[0].message.content, {
      ...this.csvOptions,
      columns: true
    });

    // Merge standardized data back with original jobs
    return chunk.map((originalJob, index) => ({
      ...originalJob,
      job_title: standardizedRows[index].job_title,
      category: standardizedRows[index].category
    }));
  }

  async standardizeJobData(jobs: JobsPikrJob[]): Promise<JobsPikrJob[]> {
    try {
      const systemPrompt = await this.getSystemPrompt();
      const chunkSize = 10;
      const chunks = Array.from(
        { length: Math.ceil(jobs.length / chunkSize) },
        (_, i) => jobs.slice(i * chunkSize, (i + 1) * chunkSize)
      );

      console.log(`Processing ${chunks.length} chunks of ${chunkSize} records each`);

      const processedChunks = await Promise.all(
        chunks.map((chunk, index) => 
          this.processChunk(chunk, systemPrompt, index, chunks.length)
        )
      );

      return processedChunks.flat();
    } catch (error) {
      console.error('Error in standardization:', error);
      throw error;
    }
  }
}