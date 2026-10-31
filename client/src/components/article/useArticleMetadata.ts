import { useEffect } from 'react';
import type { Article } from '../../types/models';
import { getImageSrc } from '../../utils/image';
/** Preserve the existing article share metadata alongside the compact reader shell. */
export function useArticleMetadata(article?: Article) {
  useEffect(() => {
    document.title = article ? `${article.title} | Upwrite` : 'Article | Upwrite';
    if (!article) return;
    const previous: Array<() => void> = [];
    const meta = (attribute: 'name' | 'property', key: string, content: string) => {
      let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
      const original = element?.content;
      if (!element) { element = document.createElement('meta'); element.setAttribute(attribute, key); document.head.appendChild(element); }
      const target = element; target.content = content;
      previous.push(() => { if (original === undefined) target.remove(); else target.content = original; });
    };
    const description = article.excerpt ?? 'Read this article on Upwrite.';
    const image = getImageSrc(article.coverImage) ?? '';
    meta('name', 'description', description);
    meta('name', 'twitter:card', 'summary_large_image');
    meta('name', 'twitter:title', article.title);
    meta('name', 'twitter:description', description);
    meta('name', 'twitter:image', image);
    for (const [key, value] of Object.entries({ 'og:title': article.title, 'og:description': description, 'og:image': image, 'og:url': `${window.location.origin}/articles/${article.author?.username}/${article.slug}`, 'og:type': 'article', 'og:site_name': 'Upwrite', 'article:author': article.author?.name ?? article.author?.username ?? 'Upwrite' })) meta('property', key, value);
    return () => previous.forEach(restore => restore());
  }, [article]);
}
