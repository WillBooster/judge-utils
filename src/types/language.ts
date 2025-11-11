import fs from 'node:fs';
import path from 'node:path';

import { deleteCommentsInSourceCode } from '../helpers/deleteCommentsInSourceCode.js';

export interface LanguageDefinition {
  /** File extensions to judge with this config. */
  fileExtension: string | readonly string[];

  /** Function executed before the build. Returns updated file paths. */
  prebuild?(cwd: string, filePaths: readonly string[]): Promise<readonly string[]>;

  /** Returns the command to build a user program. */
  buildCommand?(filePath: string): [string, ...string[]];

  /** Returns the command to run a user program. */
  command(filePath: string): [string, ...string[]];

  /** Grammer definition for static analysis. */
  grammer?: {
    strings?: readonly { open: RegExp; close: RegExp }[];
    comments?: readonly { open: RegExp; close?: RegExp }[];
  };
}

const cLikeGrammer = {
  strings: [
    { open: /'/, close: /'/ },
    { open: /"/, close: /"/ },
  ],
  comments: [{ open: /\n?[ \t]*\/\*/, close: /\*\// }, { open: /\n?[ \t]*\/\// }],
} as const satisfies LanguageDefinition['grammer'];

const javaScriptLikeGrammer = {
  strings: [
    { open: /'/, close: /'/ },
    { open: /"/, close: /"/ },
    { open: /`/, close: /`/ },
  ],
  comments: [{ open: /\n?[ \t]*\/\*/, close: /\*\// }, { open: /\n?[ \t]*\/\// }],
} as const satisfies LanguageDefinition['grammer'];

export const languageIdToDefinition: Readonly<Record<string, Readonly<LanguageDefinition>>> = {
  c: {
    fileExtension: '.c',
    buildCommand: (filePath) => ['gcc', '--std=c17', '-O2', filePath, '-o', 'main'],
    command: () => ['./main'],
    grammer: cLikeGrammer,
  },

  cpp: {
    fileExtension: '.cpp',
    buildCommand: (filePath) => ['g++', '--std=c++20', '-O2', filePath, '-o', 'main'],
    command: () => ['./main'],
    grammer: cLikeGrammer,
  },

  csharp: {
    fileExtension: '.cs',
    prebuild: async (cwd, filePaths) => {
      await fs.promises.writeFile(
        path.join(cwd, 'Main.csproj'),
        `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net8.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
    <AllowUnsafeBlocks>true</AllowUnsafeBlocks>
    <AssemblyName>Main</AssemblyName>
  </PropertyGroup>
</Project>`
      );
      return filePaths;
    },
    buildCommand: () => ['dotnet', 'build', 'Main.csproj', '--configuration', 'Release', '--verbosity', 'quiet'],
    command: () => ['dotnet', 'bin/Release/net8.0/Main.dll'],
    grammer: cLikeGrammer,
  },

  dart: {
    fileExtension: '.dart',
    buildCommand: (filePath) => ['dart', 'compile', 'exe', filePath, '-o', 'main'],
    command: () => ['./main'],
    grammer: cLikeGrammer,
  },

  java: {
    fileExtension: '.java',
    prebuild: async (cwd, filePaths) => {
      const publicClassRegex = /\bpublic\s+class\s+(\w+)\b/;
      const newFilePaths: string[] = [];
      for (const filePath of filePaths) {
        const data = await fs.promises.readFile(path.join(cwd, filePath), 'utf8');
        const [, className] = publicClassRegex.exec(deleteCommentsInSourceCode(cLikeGrammer, data)) ?? [];
        const newFilePath = className ? path.join(path.dirname(filePath), `${className}.java`) : filePath;
        await fs.promises.rename(path.join(cwd, filePath), path.join(cwd, newFilePath));
        newFilePaths.push(newFilePath);
      }
      return newFilePaths;
    },
    buildCommand: (fileName) => ['javac', fileName],
    // For example, Problem 7-3 in WillBooster's Java lecture uses at least 256MB.
    command: (fileName) => ['java', '-Xmx1024m', fileName.replace(/\.java$/, '')],
    grammer: cLikeGrammer,
  },

  javascript: {
    fileExtension: ['.js', '.cjs', '.mjs'],
    command: (fileName) => ['bun', fileName],
    grammer: javaScriptLikeGrammer,
  },

  haskell: {
    fileExtension: '.hs',
    buildCommand: (filePath) => ['ghc', '-o', 'main', filePath],
    command: () => ['./main'],
    grammer: {
      strings: [
        { open: /'/, close: /'/ },
        { open: /"/, close: /"/ },
      ],
      comments: [{ open: /\n?[ \t]*\{-/, close: /-\}/ }, { open: /\n?[ \t]*--/ }],
    },
  },

  php: {
    fileExtension: '.php',
    command: (fileName) => ['php', fileName],
    grammer: {
      strings: [
        { open: /'/, close: /'/ },
        { open: /"/, close: /"/ },
      ],
      comments: [{ open: /\n?[ \t]*\/\*/, close: /\*\// }, { open: /\n?[ \t]*\/\// }, { open: /\n?[ \t]*#/ }],
    },
  },

  python: {
    fileExtension: '.py',
    command: (fileName) => ['python3', fileName],
    grammer: {
      strings: [
        { open: /'''/, close: /'''/ },
        { open: /"""/, close: /"""/ },
        { open: /'/, close: /'/ },
        { open: /"/, close: /"/ },
      ],
      comments: [
        { open: /\n?[ \t]*'''/, close: /'''/ },
        { open: /\n?[ \t]*"""/, close: /"""/ },
        { open: /\n?[ \t]*#/ },
      ],
    },
  },

  ruby: {
    fileExtension: '.rb',
    buildCommand: (fileName) => ['ruby', '-c', fileName],
    command: (fileName) => ['ruby', '--jit', fileName],
    grammer: {
      strings: [
        { open: /'/, close: /'/ },
        { open: /"/, close: /"/ },
      ],
      comments: [{ open: /\n?[ \t]*=begin/, close: /=end/ }, { open: /\n?[ \t]*#/ }],
    },
  },

  rust: {
    fileExtension: '.rs',
    buildCommand: (filePath) => ['rustc', filePath, '-o', 'main'],
    command: () => ['./main'],
    grammer: cLikeGrammer,
  },

  zig: {
    fileExtension: '.zig',
    buildCommand: (filePath) => ['zig', 'build-exe', filePath],
    command: (filePath) => ['./' + filePath.replace(/\.zig$/, '')],
    grammer: cLikeGrammer,
  },

  typescript: {
    fileExtension: ['.ts', '.cts', '.mts'],
    command: (fileName) => ['bun', fileName],
    grammer: javaScriptLikeGrammer,
  },

  text: {
    fileExtension: '.txt',
    command: (fileName) => ['cat', fileName],
  },

  html: {
    fileExtension: '.html',
    command: () => ['echo', ''],
    grammer: {
      strings: [
        { open: /'/, close: /'/ },
        { open: /"/, close: /"/ },
      ],
      comments: [{ open: /\n?[ \t]*<!--/, close: /-->/ }],
    },
  },

  css: {
    fileExtension: '.css',
    command: () => ['echo', ''],
    grammer: {
      strings: [
        { open: /'/, close: /'/ },
        { open: /"/, close: /"/ },
      ],
      comments: [{ open: /\n?[ \t]*\/\*/, close: /\*\// }],
    },
  },

  jsp: {
    fileExtension: '.jsp',
    command: () => ['echo', ''],
    grammer: {
      strings: [
        { open: /'/, close: /'/ },
        { open: /"/, close: /"/ },
      ],
      comments: [
        { open: /\n?[ \t]*<!--/, close: /-->/ },
        { open: /\n?[ \t]*<%--/, close: /--%>/ },
        { open: /\n?[ \t]*\/\*/, close: /\*\// },
        { open: /\n?[ \t]*\/\// },
      ],
    },
  },
} as const;
