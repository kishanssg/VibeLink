import { encode } from 'gpt-tokenizer';

export function countTokens(text: string, model: string = 'gpt-4'): number {
  return encode(text).length;
}

export function compareTokens(original: string, compressed: string): {
  original: number;
  compressed: number;
  reduction: number;
} {
  const origTokens = countTokens(original);
  const compTokens = countTokens(compressed);
  
  return {
    original: origTokens,
    compressed: compTokens,
    reduction: origTokens / compTokens
  };
}

export function formatTokenStats(stats: ReturnType<typeof compareTokens>): string {
  return `
📊 Token Analysis:
  Original:   ${stats.original.toLocaleString()} tokens
  Compressed: ${stats.compressed.toLocaleString()} tokens
  Reduction:  ${stats.reduction.toFixed(1)}× smaller
  `;
}