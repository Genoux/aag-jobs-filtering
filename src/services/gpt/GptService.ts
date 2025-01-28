import OpenAI from 'openai';

export class GptService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  private getSystemPrompt(): string {
    return ``;
  }

  async standardizeJobData(csvContent: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: this.getSystemPrompt()
          },
          {
            role: "user",
            content: csvContent
          }
        ],
        response_format: { type: "text" },
        temperature: 1,
        max_tokens: 2048
      });

      return response.choices[0].message.content || csvContent;
    } catch (error) {
      console.error('Error standardizing job data:', error);
      return csvContent;
    }
  }
}