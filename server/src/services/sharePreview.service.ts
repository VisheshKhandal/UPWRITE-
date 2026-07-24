import { ArticleModel, ArticleStatus } from "../models/Article";
import { UserModel } from "../models/User";
import { env } from "../config/env";

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const absoluteUrl = (value?: string) => {
  if (!value) return `${env.CLIENT_URL}/android-chrome-512x512.png`;
  try {
    return new URL(value, env.CLIENT_URL).toString();
  } catch {
    return `${env.CLIENT_URL}/android-chrome-512x512.png`;
  }
};

interface ArticleShareMeta {
  title: string;
  articleTitle: string;
  description: string;
  image: string;
  url: string;
  author: string;
  readingTime: string;
}

export const sharePreviewService = {
  async article(username: string, slug: string) {
    const author = await UserModel.findOne({ username }).select("_id name username").lean<{ _id: unknown; name?: string; username: string }>();
    if (!author) return null;

    const article = await ArticleModel.findOne({
      author: author._id,
      slug,
      status: ArticleStatus.PUBLISHED,
      deletedAt: { $exists: false }
    })
      .select("title excerpt coverImage readingTimeMinutes")
      .lean();

    if (!article) return null;

    const articleTitle = article.title;
    const title = `${articleTitle} | Upwrite`;
    const byline = `By ${author.name || author.username}`;
    const readingTime = `${article.readingTimeMinutes || 1} min read`;
    const description = [article.excerpt, byline, readingTime].filter(Boolean).join(" · ");
    const url = `${env.CLIENT_URL}/articles/${author.username}/${slug}`;
    const fallbackImage = `${env.CLIENT_URL}/share/articles/${encodeURIComponent(author.username)}/${encodeURIComponent(slug)}/preview.svg`;
    const image = article.coverImage?.url ? absoluteUrl(article.coverImage.url) : fallbackImage;

    return {
      title,
      articleTitle,
      description,
      image,
      url,
      author: author.name || author.username,
      readingTime
    };
  },

  renderArticleHtml(meta: ArticleShareMeta) {
    const title = escapeHtml(meta.title);
    const description = escapeHtml(meta.description);
    const author = escapeHtml(meta.author);
    const readingTime = escapeHtml(meta.readingTime);
    const url = escapeHtml(meta.url);
    const image = escapeHtml(meta.image);

    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta name="author" content="${author}" />
    <meta property="og:site_name" content="Upwrite" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${image}" />
    <meta property="article:author" content="${author}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />
    <meta name="upwrite:reading_time" content="${readingTime}" />
    <link rel="canonical" href="${url}" />
    <meta http-equiv="refresh" content="0;url=${url}" />
  </head>
  <body>
    <main>
      <p><a href="${url}">Read on Upwrite</a></p>
    </main>
  </body>
</html>`;
  },

  renderFallbackImage(meta: ArticleShareMeta) {
    const title = escapeHtml(meta.articleTitle);
    const author = escapeHtml(meta.author);
    const readingTime = escapeHtml(meta.readingTime);

    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#fffdf7"/>
      <stop offset="52%" stop-color="#f6f7fb"/>
      <stop offset="100%" stop-color="#eef7f2"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="56" y="56" width="1088" height="518" rx="32" fill="#ffffff" stroke="#d8dde8" stroke-width="2"/>
  <circle cx="132" cy="132" r="38" fill="#111827"/>
  <text x="132" y="146" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="800" fill="#ffffff">U</text>
  <text x="188" y="124" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="800" fill="#111827">Upwrite</text>
  <text x="188" y="154" font-family="Inter, Arial, sans-serif" font-size="18" fill="#667085">Read, write, and build your learning library</text>
  <foreignObject x="96" y="220" width="1008" height="190">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Inter, Arial, sans-serif; font-size: 58px; line-height: 1.1; font-weight: 800; color: #111827;">
      ${title}
    </div>
  </foreignObject>
  <text x="96" y="488" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="700" fill="#344054">By ${author}</text>
  <text x="96" y="528" font-family="Inter, Arial, sans-serif" font-size="22" fill="#667085">${readingTime}</text>
</svg>`;
  }
};
