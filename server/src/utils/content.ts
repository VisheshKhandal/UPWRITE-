import slugify from "slugify";

export const createSlug = (value: string) =>
  slugify(value, {
    lower: true,
    strict: true,
    trim: true
  });

export const estimateReadingTime = (content: string) => {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
};

export const createExcerpt = (content: string, maxLength = 180) => {
  const clean = content.replace(/[#>*_`[\]()]/g, "").replace(/\s+/g, " ").trim();
  return clean.length > maxLength ? `${clean.slice(0, maxLength).trim()}...` : clean;
};
