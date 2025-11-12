import { z } from 'zod';

export const StubBase = z.object({
  archetype: z.literal('stub'),
  foo: z.number(),
  bar: z.number(),
});

export const StubSchema = z.preprocess((raw) => {
  const o: any = raw ?? {};

  return { ...o, archetype: 'stub' };
}, StubBase);
