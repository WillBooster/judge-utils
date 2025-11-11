import fs from 'node:fs';
import path from 'node:path';

export async function readTestCases(dir: string): Promise<{ id: string; stdin?: string; stdout?: string }[]> {
  const idSet = new Set<string>();
  const idToStdin = new Map<string, string>();
  const idToStdout = new Map<string, string>();

  for (const dirent of await fs.promises.readdir(dir, { withFileTypes: true })) {
    if (!dirent.isFile()) continue;

    const { ext, name } = path.parse(dirent.name);
    if (ext !== '.in' && ext !== '.out') continue;

    const content = await fs.promises.readFile(path.join(dir, dirent.name), 'utf8');

    idSet.add(name);
    if (ext === '.in') idToStdin.set(name, content);
    if (ext === '.out') idToStdout.set(name, content);
  }

  return [...idSet].toSorted().map((id) => ({ id, stdin: idToStdin.get(id), stdout: idToStdout.get(id) }));
}
