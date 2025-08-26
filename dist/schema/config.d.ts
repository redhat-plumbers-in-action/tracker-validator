import { z } from 'zod';
export declare const configLabelsSchema: z.ZodObject<{
    'missing-tracker': z.ZodString;
    'missing-severity': z.ZodString;
    'invalid-product': z.ZodString;
    'invalid-component': z.ZodString;
    unapproved: z.ZodString;
}, z.core.$strip>;
export type ConfigLabels = z.infer<typeof configLabelsSchema>;
export declare const configProductsSchema: z.ZodArray<z.ZodString>;
export type ConfigProducts = z.infer<typeof configProductsSchema>;
export declare const configSchema: z.ZodObject<{
    products: z.ZodArray<z.ZodString>;
    labels: z.ZodObject<{
        'missing-tracker': z.ZodString;
        'missing-severity': z.ZodString;
        'invalid-product': z.ZodString;
        'invalid-component': z.ZodString;
        unapproved: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
