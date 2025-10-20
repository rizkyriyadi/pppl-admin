/**
 * AI Response Formatter
 * Converts AI responses to rich text with proper styling
 */

export interface FormattedResponse {
  html: string;
  plainText: string;
}

/**
 * Formats AI response text into rich HTML with proper styling
 */
export function formatAIResponse(text: string): FormattedResponse {
  if (!text || typeof text !== 'string') {
    return { html: '', plainText: '' };
  }

  let html = text;
  const plainText = text;

  // Convert headers (## Header -> <h2>, ### Header -> <h3>, etc.)
  html = html.replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold text-slate-800 mt-4 mb-2">$1</h3>');
  html = html.replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold text-slate-900 mt-6 mb-3">$1</h2>');
  html = html.replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-slate-900 mt-6 mb-4">$1</h1>');

  // Convert bold text (**text** -> <strong>)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-900">$1</strong>');

  // Convert italic text (*text* -> <em>)
  html = html.replace(/\*(.*?)\*/g, '<em class="italic text-slate-700">$1</em>');

  // Convert bullet points (- item -> <li>)
  html = html.replace(/^- (.*$)/gm, '<li class="ml-4 text-slate-700">• $1</li>');
  
  // Wrap consecutive list items in <ul>
  html = html.replace(/(<li[^>]*>.*<\/li>\s*)+/g, (match) => {
    return `<ul class="space-y-1 mb-3">${match}</ul>`;
  });

  // Convert numbered lists (1. item -> <li>)
  html = html.replace(/^\d+\.\s+(.*$)/gm, '<li class="ml-4 text-slate-700">$1</li>');
  
  // Wrap consecutive numbered list items in <ol>
  html = html.replace(/(<li class="ml-4 text-slate-700">[^<]*<\/li>\s*)+/g, (match) => {
    // Only convert if it's not already in a <ul>
    if (!match.includes('•')) {
      return `<ol class="list-decimal list-inside space-y-1 mb-3 ml-4">${match}</ol>`;
    }
    return match;
  });

  // Convert code blocks (```code``` -> <pre><code>)
  html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-slate-100 rounded-md p-3 mb-3 overflow-x-auto"><code class="text-sm text-slate-800">$1</code></pre>');

  // Convert inline code (`code` -> <code>)
  html = html.replace(/`([^`]+)`/g, '<code class="bg-slate-100 text-slate-800 px-1 py-0.5 rounded text-sm">$1</code>');

  // Convert line breaks to <br> and wrap paragraphs
  const lines = html.split('\n');
  const formattedLines: string[] = [];
  let currentParagraph: string[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // If it's a header, list item, or code block, close current paragraph and add the line
    if (trimmedLine.match(/^<(h[1-6]|li|ul|ol|pre)/)) {
      if (currentParagraph.length > 0) {
        formattedLines.push(`<p class="text-slate-700 mb-3 leading-relaxed">${currentParagraph.join(' ')}</p>`);
        currentParagraph = [];
      }
      formattedLines.push(trimmedLine);
    }
    // If it's an empty line, close current paragraph
    else if (trimmedLine === '') {
      if (currentParagraph.length > 0) {
        formattedLines.push(`<p class="text-slate-700 mb-3 leading-relaxed">${currentParagraph.join(' ')}</p>`);
        currentParagraph = [];
      }
    }
    // Otherwise, add to current paragraph
    else {
      currentParagraph.push(trimmedLine);
    }
  }

  // Close any remaining paragraph
  if (currentParagraph.length > 0) {
    formattedLines.push(`<p class="text-slate-700 mb-3 leading-relaxed">${currentParagraph.join(' ')}</p>`);
  }

  html = formattedLines.join('\n');

  // Add highlighting for important information
  html = html.replace(/\b(PENTING|IMPORTANT|PERHATIAN|NOTE|CATATAN)\b:?/gi, 
    '<span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-amber-100 text-amber-800 mr-1">$1</span>');

  // Add highlighting for recommendations
  html = html.replace(/\b(REKOMENDASI|RECOMMENDATION|SARAN|SUGGESTION)\b:?/gi, 
    '<span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 mr-1">$1</span>');

  // Add highlighting for warnings
  html = html.replace(/\b(PERINGATAN|WARNING|HATI-HATI|CAUTION)\b:?/gi, 
    '<span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800 mr-1">$1</span>');

  return {
    html: html.trim(),
    plainText: plainText.trim()
  };
}

/**
 * Formats statistics and metrics with proper styling
 */
export function formatStatistics(stats: Record<string, number | string>): string {
  const entries = Object.entries(stats);
  if (entries.length === 0) return '';

  const statsHtml = entries.map(([key, value]) => {
    const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    return `
      <div class="flex justify-between items-center py-2 border-b border-slate-200 last:border-b-0">
        <span class="text-slate-600 font-medium">${formattedKey}</span>
        <span class="text-slate-900 font-semibold">${value}</span>
      </div>
    `;
  }).join('');

  return `
    <div class="bg-slate-50 rounded-lg p-4 mb-4">
      <h4 class="text-sm font-semibold text-slate-800 mb-3 uppercase tracking-wide">Statistik</h4>
      <div class="space-y-1">
        ${statsHtml}
      </div>
    </div>
  `;
}

/**
 * Creates a loading state for AI analysis
 */
export function createLoadingState(): string {
  return `
    <div class="flex items-center gap-3 text-slate-600">
      <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-600"></div>
      <p class="text-sm">Sedang menganalisis data Anda...</p>
    </div>
  `;
}

/**
 * Creates an error state for AI analysis
 */
export function createErrorState(error: string): string {
  return `
    <div class="bg-red-50 border border-red-200 rounded-lg p-4">
      <div class="flex items-center gap-2 mb-2">
        <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <h4 class="text-sm font-semibold text-red-800">Terjadi Kesalahan</h4>
      </div>
      <p class="text-sm text-red-700">${error}</p>
    </div>
  `;
}