import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Case study / progetti (usati anche come vetrina portfolio di Simona/NosLab).
 * Un file Markdown per progetto in src/content/projects/.
 */
const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      titolo: z.string(),
      cliente: z.string(),
      settore: z.string(),
      sfida: z.string(),
      soluzione: z.string(),
      /** Risultati chiave, uno per punto elenco. */
      risultati: z.array(z.string()).default([]),
      /** Immagine di copertina (usata anche per Open Graph). */
      cover: image().optional(),
      /** Galleria immagini del case study. */
      immagini: z.array(image()).default([]),
      data: z.coerce.date(),
      inEvidenza: z.boolean().default(false),
      ordine: z.number().default(0),
    }),
});

/**
 * Servizi offerti. Un file Markdown per servizio in src/content/services/.
 */
const services = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/services' }),
  schema: ({ image }) =>
    z.object({
      titolo: z.string(),
      descrizione: z.string(),
      /** Nome icona (es. da un set SVG) — alternativa a `immagine`. */
      icona: z.string().optional(),
      immagine: image().optional(),
      ordine: z.number().default(0),
    }),
});

export const collections = { projects, services };
