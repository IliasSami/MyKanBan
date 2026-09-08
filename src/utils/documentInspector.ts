import { parseMarkdown, parseJSON, parseCSV } from './parser';
import type { ParseResult } from '../types/kanban';

export type DocumentType = 'markdown' | 'notes' | 'json' | 'csv';

export interface DocumentDiagnosis {
  status: 'empty' | 'ready' | 'needs_ai' | 'syntax_error';
  title: string;
  message: string;
  details?: string[];
}

export interface DocumentInspectionResult {
  isParsable: boolean;
  docType: DocumentType;
  detectedFormat: 'markdown' | 'json' | 'csv' | 'unstructured';
  parseResult: ParseResult | null;
  tasksCount: number;
  columnsCount: number;
  pointsCount: number;
  diagnosis: DocumentDiagnosis;
}

/**
 * Systematically analyzes document content and determines if it is
 * natively parsable by MyKanBan or requires AI / Heuristic conversion.
 */
export function inspectDocument(
  content: string,
  preferredType: DocumentType = 'markdown'
): DocumentInspectionResult {
  const trimmed = content.trim();

  // 1. Empty Content Check
  if (!trimmed) {
    return {
      isParsable: false,
      docType: preferredType,
      detectedFormat: 'unstructured',
      parseResult: null,
      tasksCount: 0,
      columnsCount: 0,
      pointsCount: 0,
      diagnosis: {
        status: 'empty',
        title: 'No Document Loaded',
        message: 'Upload a file (.md, .txt, .json, .csv) or paste document text to begin.',
      },
    };
  }

  // 2. JSON / KBF Format Inspection
  if (preferredType === 'json' || trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = parseJSON(trimmed);
      const tasksCount = parsed.columns.reduce((acc, col) => acc + col.tasks.length, 0);
      const pointsCount = parsed.columns.reduce(
        (acc, col) => acc + col.tasks.reduce((p, t) => p + (t.storyPoints || 0), 0),
        0
      );

      if (parsed.columns.length > 0 && tasksCount > 0) {
        return {
          isParsable: true,
          docType: 'json',
          detectedFormat: 'json',
          parseResult: parsed,
          tasksCount,
          columnsCount: parsed.columns.length,
          pointsCount,
          diagnosis: {
            status: 'ready',
            title: 'Native Kanban JSON (KBF) Detected',
            message: `Found ${parsed.columns.length} workflow columns and ${tasksCount} structured tasks. Ready for direct import.`,
          },
        };
      } else {
        return {
          isParsable: false,
          docType: 'json',
          detectedFormat: 'json',
          parseResult: null,
          tasksCount: 0,
          columnsCount: 0,
          pointsCount: 0,
          diagnosis: {
            status: 'needs_ai',
            title: 'JSON Document Missing Kanban Structure',
            message: 'This JSON does not follow the standard columns/tasks schema. Internal AI can restructure it.',
            details: [
              'Expected: { "title": "...", "columns": [{ "title": "...", "tasks": [...] }] }',
            ],
          },
        };
      }
    } catch (err: any) {
      return {
        isParsable: false,
        docType: 'json',
        detectedFormat: 'unstructured',
        parseResult: null,
        tasksCount: 0,
        columnsCount: 0,
        pointsCount: 0,
        diagnosis: {
          status: 'syntax_error',
          title: 'Invalid JSON Syntax',
          message: err?.message || 'The provided JSON is malformed. Internal AI can fix and parse it.',
        },
      };
    }
  }

  // 3. CSV Format Inspection
  if (preferredType === 'csv') {
    try {
      const parsed = parseCSV(trimmed);
      const tasksCount = parsed.columns.reduce((acc, col) => acc + col.tasks.length, 0);
      const pointsCount = parsed.columns.reduce(
        (acc, col) => acc + col.tasks.reduce((p, t) => p + (t.storyPoints || 0), 0),
        0
      );

      if (parsed.columns.length > 0 && tasksCount > 0) {
        return {
          isParsable: true,
          docType: 'csv',
          detectedFormat: 'csv',
          parseResult: parsed,
          tasksCount,
          columnsCount: parsed.columns.length,
          pointsCount,
          diagnosis: {
            status: 'ready',
            title: 'Valid CSV Task Table Detected',
            message: `Detected ${parsed.columns.length} status lanes and ${tasksCount} tasks. Ready for direct import.`,
          },
        };
      } else {
        return {
          isParsable: false,
          docType: 'csv',
          detectedFormat: 'unstructured',
          parseResult: null,
          tasksCount: 0,
          columnsCount: 0,
          pointsCount: 0,
          diagnosis: {
            status: 'needs_ai',
            title: 'Unrecognized CSV Layout',
            message: 'Could not find required task title or status columns. Internal AI can map your CSV columns.',
            details: ['Expected headers: Title, Column/Status, Priority, Story Points, Assignee'],
          },
        };
      }
    } catch (err: any) {
      return {
        isParsable: false,
        docType: 'csv',
        detectedFormat: 'unstructured',
        parseResult: null,
        tasksCount: 0,
        columnsCount: 0,
        pointsCount: 0,
        diagnosis: {
          status: 'syntax_error',
          title: 'CSV Parsing Error',
          message: err?.message || 'Could not parse CSV. Internal AI can convert it into Kanban format.',
        },
      };
    }
  }

  // 4. Markdown & Unstructured Notes Inspection
  // Analyze structural markers:
  // A. Column headers: `## Column` or `### Column` or `**Column:**`
  const lines = trimmed.split(/\r?\n/);
  const columnHeaderRegex = /^(?:#{2,4}\s+[A-Za-z0-9]|(?:\*\*[A-Za-z0-9\s-]+\*\*:?$))/;
  const taskBulletRegex = /^(?:[-*+]|\d+\.)\s+(?:\[([ xX])\]\s+)?\S+/;

  let foundColumnHeader = false;
  let taskBulletCount = 0;
  let proseLineCount = 0;

  for (const line of lines) {
    const l = line.trim();
    if (!l) continue;
    if (columnHeaderRegex.test(l)) {
      foundColumnHeader = true;
    } else if (taskBulletRegex.test(l)) {
      taskBulletCount++;
    } else if (!l.startsWith('#') && !l.startsWith('>')) {
      proseLineCount++;
    }
  }

  // Try standard parse
  const parsed = parseMarkdown(trimmed);
  const tasksCount = parsed.columns.reduce((acc, col) => acc + col.tasks.length, 0);
  const pointsCount = parsed.columns.reduce(
    (acc, col) => acc + col.tasks.reduce((p, t) => p + (t.storyPoints || 0), 0),
    0
  );

  // High-fidelity native Markdown: has explicit column headers AND task bullets
  const isHighConfidenceNativeMD =
    foundColumnHeader && taskBulletCount >= 1 && tasksCount > 0;

  if (isHighConfidenceNativeMD && preferredType !== 'notes') {
    return {
      isParsable: true,
      docType: 'markdown',
      detectedFormat: 'markdown',
      parseResult: parsed,
      tasksCount,
      columnsCount: parsed.columns.length,
      pointsCount,
      diagnosis: {
        status: 'ready',
        title: 'Native MyKanBan Markdown Detected',
        message: `Structured workflow detected with ${parsed.columns.length} stages and ${tasksCount} tasks. Ready for 1-click import.`,
        details: parsed.columns.map((c) => `${c.title}: ${c.tasks.length} tasks`),
      },
    };
  }

  // If user selected "notes" or no explicit columns were found, or it's mostly prose / unstructured
  const missingReason: string[] = [];
  if (!foundColumnHeader) {
    missingReason.push('No Kanban column headers found (e.g. ## To Do, ## In Progress, ## Done)');
  }
  if (taskBulletCount === 0) {
    missingReason.push('No task bullet items found (e.g. - [ ] Task description)');
  }
  if (proseLineCount > taskBulletCount * 2) {
    missingReason.push('Document contains unstructured narrative prose or meeting notes');
  }

  return {
    isParsable: false,
    docType: preferredType,
    detectedFormat: 'unstructured',
    parseResult: null,
    tasksCount: 0,
    columnsCount: 0,
    pointsCount: 0,
    diagnosis: {
      status: 'needs_ai',
      title: 'Unstructured Document Detected (Needs Conversion)',
      message:
        'This document is not in native MyKanBan format. Use the integrated Nara AI to automatically parse, structure stages, and extract tasks.',
      details: missingReason.length > 0 ? missingReason : ['Document requires stage and task structuring'],
    },
  };
}
