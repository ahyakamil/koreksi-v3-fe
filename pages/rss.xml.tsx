import { GetServerSideProps } from 'next';

interface NewsItem {
  public_id: string;
  title: string;
  content: string;
  published_at: string;
  user?: {
    name: string;
  };
}

export default function Rss() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    const response = await fetch(`${apiUrl}/news?page=0&size=50`);
    const data = await response.json();
    const news: NewsItem[] = data.data.content || [];

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
<title>News Feed</title>
<link>${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/news</link>
<description>Latest published news</description>
<language>en-us</language>
<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${news.map(item => `
<item>
<title>${escapeXml(decodeHtmlEntities(item.title))}</title>
<link>${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/news/${encodeURIComponent(item.public_id)}</link>
<guid>${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/news/${encodeURIComponent(item.public_id)}</guid>
<description>${escapeXml(stripHtml(decodeHtmlEntities(item.content)))}</description>
<pubDate>${new Date(item.published_at).toUTCString()}</pubDate>
${item.user ? `<author>${escapeXml(item.user.name)}</author>` : ''}
</item>
`).join('')}
</channel>
</rss>`;

    res.setHeader('Content-Type', 'application/rss+xml');
    res.write(rss);
    res.end();

    return { props: {} };
  } catch (error) {
    console.error('Error generating RSS:', error);
    res.statusCode = 500;
    res.end('Error generating RSS');
    return { props: {} };
  }
};

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c: string) => {
    switch (c) {
      case '<': return '<';
      case '>': return '>';
      case '&': return '&';
      case "'": return "'";
      case '"': return '"';
      default: return c;
    }
  });
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

function decodeHtmlEntities(text: string): string {
  const entities: { [key: string]: string } = {
    '&': '&',
    '<': '<',
    '>': '>',
    '"': '"',
    "'": "'",
    '&#x27;': "'",
    '&#x2F;': '/',
    '&#x60;': '`',
    '&#x3D;': '='
  };
  return text.replace(/&[a-zA-Z0-9#]+;/g, (entity) => entities[entity] || entity);
}