import { languageIdToDefinition } from '../types/language.js';
import type { LanguageDefinition } from '../types/language.js';

export function getLanguageDefinitionByFilename(filename: string): LanguageDefinition | undefined {
  return Object.values(languageIdToDefinition).find((definition) =>
    definition.fileExtensions.some((ext) => filename.endsWith(ext))
  );
}
