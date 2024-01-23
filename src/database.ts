import path from 'node:path';

import { relations } from 'drizzle-orm';
import { text, integer, real, sqliteTable, primaryKey } from 'drizzle-orm/sqlite-core';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { getConfigDirectoryPath } from './util';

// ------------ Prompts ------------

export const prompts = sqliteTable('prompts', {
  id: text('id').primaryKey(),
  raw: text('raw').notNull(),
  hash: text('hash').notNull(),
});

export const promptsRelations = relations(prompts, ({ many }) => ({
  evalsToPrompts: many(evalsToPrompts),
}));

// ------------ Datasets ------------

export const datasets = sqliteTable('datasets', {
  id: text('id').primaryKey(),
  testCaseId: text('test_case_id').notNull(),
  createdAt: text('created_at').notNull(),
});

export const datasetsRelations = relations(datasets, ({ many }) => ({
  evalsToDatasets: many(evalsToDatasets),
}));

// ------------ Evals ------------

export const evals = sqliteTable('evals', {
  id: text('id').primaryKey(),
  createdAt: text('created_at').notNull(),
  providerId: text('provider_id').notNull(),
  metrics: text('metrics').notNull(),
});

export const evalsRelations = relations(evals, ({ many }) => ({
  evalsToPrompts: many(evalsToPrompts),
  evalsToDatasets: many(evalsToDatasets),
}));

export const evalsToPrompts = sqliteTable(
  'evals_to_prompts',
  {
    evalId: text('eval_id')
      .notNull()
      .references(() => evals.id),
    promptId: text('prompt_id')
      .notNull()
      .references(() => prompts.id),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.evalId, t.promptId] }),
  }),
);

export const evalsToPromptsRelations = relations(evalsToPrompts, ({ one }) => ({
  eval: one(evals, {
    fields: [evalsToPrompts.evalId],
    references: [evals.id],
  }),
  prompt: one(prompts, {
    fields: [evalsToPrompts.promptId],
    references: [prompts.id],
  }),
}));

export const evalsToDatasets = sqliteTable(
  'evals_to_datasets',
  {
    evalId: text('eval_id')
      .notNull()
      .references(() => evals.id),
    datasetId: text('dataset_id')
      .notNull()
      .references(() => datasets.id),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.evalId, t.datasetId] }),
  }),
);

export const evalsToDatasetsRelations = relations(evalsToDatasets, ({ one }) => ({
  eval: one(evals, {
    fields: [evalsToDatasets.evalId],
    references: [evals.id],
  }),
  dataset: one(datasets, {
    fields: [evalsToDatasets.datasetId],
    references: [datasets.id],
  }),
}));

// ------------ Outputs ------------


export const llmOutputs = sqliteTable(
  'llm_outputs',
  {
    id: text('id')
      .notNull()
      .unique(),
    evalId: text('eval_id')
      .notNull()
      .references(() => evals.id),
    promptId: text('prompt_id')
      .notNull()
      .references(() => prompts.id),
    providerId: text('provider_id').notNull(),
    vars: text('vars', {mode: 'json'}),
    response: text('response', {mode: 'json'}),
    error: text('error'),
    latencyMs: integer('latency_ms'),
    gradingResult: text('grading_result', {mode: 'json'}),
    namedScores: text('named_scores', {mode: 'json'}),
    cost: real('cost'),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.id] }),
  }),
);

export const llmOutputsRelations = relations(llmOutputs, ({ one }) => ({
  eval: one(evals, {
    fields: [llmOutputs.evalId],
    references: [evals.id],
  }),
  prompt: one(prompts, {
    fields: [llmOutputs.promptId],
    references: [prompts.id],
  }),
}));

const sqlite = new Database(path.resolve(getConfigDirectoryPath(), 'sqlite.db'));
export const db = drizzle(sqlite);
