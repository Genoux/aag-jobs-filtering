import sanitizeHtml from 'sanitize-html';
import { BaseJob } from '@localtypes/job';

export const formatters = {
  sanitizeDescription(job: BaseJob): string {
    if (!job.description) {
      return '<div>No description provided</div>';
    }

    let content = job.description;

    content = content.replace(/<strong>(.*?)<\/strong>/g, '<p><strong>$1</strong></p>');

    content = content
      .replace(/(?<=>)([^<]+)(?=<)/g, (_, text) => {
        return text.trim() ? `<p>${text.trim()}</p>` : text;
      });

    const cleanHtml = sanitizeHtml(content, {
      allowedTags: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'ul', 'ol', 'li', 'strong', 'em',
        'a'
      ],
      allowedAttributes: {
        'a': ['href']
      },
      transformTags: {
        'div': 'p'
      }
    });

    return cleanHtml;
  }
};