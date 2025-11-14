import { z } from 'zod';
import { VegaLiteSchema, VegaLiteCore } from './vega-lite/schema.ts';
import { StubSchema } from './schema-stub/schema.ts';

export const ChartSchema = z.any;
