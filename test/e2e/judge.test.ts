/* eslint-disable @typescript-eslint/no-unsafe-assignment -- to allow `expect.any */
import child_process from 'node:child_process';
import fs from 'node:fs';

import { expect, test } from 'vitest';

import type { TestCaseResult } from '../../src/types/testCaseResult.js';
import { TEST_CASE_RESULT_PREFIX, testCaseResultSchema } from '../../src/types/testCaseResult.js';

test.each<[string, Record<string, unknown>, TestCaseResult[]]>([
  [
    'example/a_plus_b',
    { cwd: 'model_answers/java' },
    [
      {
        testCaseId: '01_small_1',
        decisionCode: 2000,
        exitStatus: 0,
        stdin: '1 1\n',
        stdout: '2\n',
        timeSeconds: expect.any(Number),
        memoryBytes: expect.any(Number),
      },
      {
        testCaseId: '01_small_2',
        decisionCode: 2000,
        exitStatus: 0,
        stdin: '2 3\n',
        stdout: '5\n',
        timeSeconds: expect.any(Number),
        memoryBytes: expect.any(Number),
      },
      {
        testCaseId: '02_large_1',
        decisionCode: 2000,
        exitStatus: 0,
        stdin: '883855166 558951962\n',
        stdout: '1442807128\n',
        timeSeconds: expect.any(Number),
        memoryBytes: expect.any(Number),
      },
      {
        testCaseId: '02_large_2',
        decisionCode: 2000,
        exitStatus: 0,
        stdin: '517836678 497798119\n',
        stdout: '1015634797\n',
        timeSeconds: expect.any(Number),
        memoryBytes: expect.any(Number),
      },
      {
        testCaseId: '03_edge_1',
        decisionCode: 2000,
        exitStatus: 0,
        stdin: '0 0\n',
        stdout: '0\n',
        stderr: '',
        timeSeconds: expect.any(Number),
        memoryBytes: expect.any(Number),
        feedbackMarkdown: '',
        outputFiles: [],
      },
      {
        testCaseId: '03_edge_2',
        decisionCode: 2000,
        exitStatus: 0,
        stdin: '1000000000 1000000000\n',
        stdout: '2000000000\n',
        timeSeconds: expect.any(Number),
        memoryBytes: expect.any(Number),
      },
      {
        testCaseId: '03_edge_3',
        decisionCode: 2000,
        exitStatus: 0,
        stdin: '0 1000000000\n',
        stdout: '1000000000\n',
        timeSeconds: expect.any(Number),
        memoryBytes: expect.any(Number),
      },
      {
        testCaseId: '03_edge_4',
        decisionCode: 2000,
        exitStatus: 0,
        stdin: '1000000000 0\n',
        stdout: '1000000000\n',
        timeSeconds: expect.any(Number),
        memoryBytes: expect.any(Number),
      },
    ],
  ],
])('%s %j', async (cwd, params, expectedTestCaseResults) => {
  await fs.promises.mkdir('temp', { recursive: true });
  const spawnResult = child_process.spawnSync('bun', ['judge.ts', JSON.stringify(params)], { cwd, encoding: 'utf8' });

  if (spawnResult.stderr) console.error(spawnResult.stderr);

  const testCaseResults = spawnResult.stdout
    .split('\n')
    .filter((line) => line.startsWith(TEST_CASE_RESULT_PREFIX))
    .map((line) => testCaseResultSchema.parse(JSON.parse(line.slice(TEST_CASE_RESULT_PREFIX.length))));

  expect(testCaseResults).toEqual(expectedTestCaseResults);
});
