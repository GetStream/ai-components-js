import { VegaLiteSchema } from '../vega-lite/schema.ts';
import { parseVegalite } from '../vega-lite/parser.ts';
import type { ChartSpec } from '../types.ts';

export const parseJsonChart = (code: string): ChartSpec => {
  const json = JSON.parse(code);

  try {
    const parsedVegaLite = VegaLiteSchema.parse(json);
    return parseVegalite(parsedVegaLite);
  } catch (_error) {
    /* do nothing */
  }

  throw new Error('Unknown type of JSON formatted chart.');
};
