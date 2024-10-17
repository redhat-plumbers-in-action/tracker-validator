import { z } from 'zod';
export const configLabelsSchema = z.object({
    'missing-tracker': z.string().min(1),
    'missing-severity': z.string().min(1),
    'invalid-product': z.string().min(1),
    'invalid-component': z.string().min(1),
    unapproved: z.string().min(1),
});
export const configProductsSchema = z.array(z.string().min(1));
export const configSchema = z.object({
    products: configProductsSchema,
    labels: configLabelsSchema,
});
//# sourceMappingURL=config.js.map