import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context: { site: URL }) {
  const articles = await getCollection('articles');
  const sortedArticles = articles.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  return rss({
    title: 'Subroutine CS - Interactive Computer Science & Systems Blog',
    description: 'An interactive educational blog covering algorithms, low-level systems optimization, C++, networking, and computer architecture with audio-visual simulations.',
    site: context.site || 'https://subroutine-cs.cc',
    items: sortedArticles.map((article) => ({
      title: article.data.title,
      pubDate: article.data.date,
      description: article.data.summary,
      link: `/articles/${article.slug}/`,
      categories: [article.data.category],
    })),
    customData: `<language>en-us</language>`,
  });
}
