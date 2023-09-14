import { z } from 'zod';
export declare const configLabelsSchema: z.ZodObject<{
    'missing-tracker': z.ZodString;
    'invalid-product': z.ZodString;
    'invalid-component': z.ZodString;
    unapproved: z.ZodString;
}, "strip", z.ZodTypeAny, {
    'missing-tracker': string;
    'invalid-product': string;
    'invalid-component': string;
    unapproved: string;
}, {
    'missing-tracker': string;
    'invalid-product': string;
    'invalid-component': string;
    unapproved: string;
}>;
export type ConfigLabels = z.infer<typeof configLabelsSchema>;
export declare const configProductsSchema: z.ZodArray<z.ZodString, "many">;
export type ConfigProducts = z.infer<typeof configProductsSchema>;
export declare const configSchema: z.ZodObject<{
    products: z.ZodArray<z.ZodString, "many">;
    labels: z.ZodObject<{
        'missing-tracker': z.ZodString;
        'invalid-product': z.ZodString;
        'invalid-component': z.ZodString;
        unapproved: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        'missing-tracker': string;
        'invalid-product': string;
        'invalid-component': string;
        unapproved: string;
    }, {
        'missing-tracker': string;
        'invalid-product': string;
        'invalid-component': string;
        unapproved: string;
    }>;
}, "strip", z.ZodTypeAny, {
    labels: {
        'missing-tracker': string;
        'invalid-product': string;
        'invalid-component': string;
        unapproved: string;
    };
    products: string[];
}, {
    labels: {
        'missing-tracker': string;
        'invalid-product': string;
        'invalid-component': string;
        unapproved: string;
    };
    products: string[];
}>;
