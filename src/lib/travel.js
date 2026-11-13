import { basename } from 'node:path';
import { sortPostsByDateDesc } from './writing.js';

export function getTravelPosts() {
  const articles = import.meta.glob('../content/travel/*.md', { eager: true });
  return sortPostsByDateDesc(Object.values(articles)).map((post) => ({
    ...post,
    slug: basename(post.file, '.md'),
  }));
}
