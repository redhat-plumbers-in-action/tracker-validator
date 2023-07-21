import { z } from 'zod';

export const configLabelsSchema = z.object({
  'invalid-product': z.string().min(1),
  'invalid-component': z.string().min(1),
  unapproved: z.string().min(1),
});
export type ConfigLabels = z.infer<typeof configLabelsSchema>;

export const configProductsSchema = z.array(z.string().min(1));
export type ConfigProducts = z.infer<typeof configProductsSchema>;

export const configSchema = z.object({
  products: configProductsSchema,
  labels: configLabelsSchema,
});
