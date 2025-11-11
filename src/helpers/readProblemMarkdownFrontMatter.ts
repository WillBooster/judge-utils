import fs from 'node:fs';
import path from 'node:path';

import parseFrontMatter from 'front-matter';

import type { ProblemMarkdownFrontMatter } from '../types/problem.js';
import { problemMarkdownFrontMatterSchema } from '../types/problem.js';

export async function readProblemMarkdownFrontMatter(dir: string): Promise<ProblemMarkdownFrontMatter> {
  for (const dirent of await fs.promises.readdir(dir, { withFileTypes: true })) {
    if (!dirent.isFile()) continue;
    if (!dirent.name.endsWith('.problem.md')) continue;

    const markdown = await fs.promises.readFile(path.join(dir, dirent.name), 'utf8');

    const { attributes } = (parseFrontMatter as unknown as (markdown: string) => { attributes: unknown })(markdown);

    return problemMarkdownFrontMatterSchema.parse(attributes);
  }

  throw new Error(`problem markdown not found: ${dir}`);
}
