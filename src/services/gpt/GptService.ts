import OpenAI from 'openai'
import { parse } from 'csv-parse/sync'
import fs from 'fs'
import path from 'path'

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
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: csvContent
          }
        ],
        response_format: { type: "text" },
        temperature: 0.2,
        max_tokens: 12000,
        stop: ["\n\n"],
        frequency_penalty: 0,
        presence_penalty: 0
      })

      const standardizedContent = response.choices[0].message.content

      if (!standardizedContent) {
        throw new Error('No standardized content received from GPT')
      }

      try {
        parse(standardizedContent, this.csvOptions)
      } catch (error) {
        console.error('Invalid CSV format or validation failed:', error)
        throw error
      }

      return standardizedContent

    } catch (error) {
      console.error('Error in GPT processing:', error)
      if (error instanceof Error) {
        console.error('Error details:', error.message)
      }
      throw error
    }
  }
}