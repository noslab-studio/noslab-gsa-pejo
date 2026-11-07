import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Servizi offerti. Un file Markdown per servizio in src/content/services/.
 */
const services = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/services' }),
  schema: ({ image }) =>
    z.object({
      titolo: z.string(),
      descrizione: z.string(),
      /** Nome icona (es. da un set SVG), alternativa a `immagine`. */
      icona: z.string().optional(),
      immagine: image().optional(),
      ordine: z.number().default(0),
    }),
});

export const collections = { services };
