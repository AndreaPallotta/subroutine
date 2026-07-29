export function calculateReadingTime(content: string): string {
  const cleanContent = content.replace(/<[^>]*>/g, '').replace(/#+/g, '');
  const wordCount = cleanContent.trim().split(/\s+/).length;
  // 120 words per minute for technical code/formulas + 2 min baseline for interactive visualizer exploration
  const minutes = Math.max(4, Math.ceil(wordCount / 120) + 2);
  return `${minutes} min read`;
}
