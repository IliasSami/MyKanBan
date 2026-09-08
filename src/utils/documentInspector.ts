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

  // Count explicit checkbox markers: `- [ ]` or `- [x]`
  let checkboxCount = 0;
  for (const line of lines) {
    if (/^[-*+]\s+\[[ xX]\]/.test(line.trim())) {
      checkboxCount++;
    }
  }

  // Detect report/document headings that indicate an article, audit, or documentation rather than a Kanban board
  const hasReportHeadings = parsed.columns.some((c) =>
    /^(?:\d+\.|\d+\s+|Executive|Summary|Appendix|Glossary|Methodology|Scope|Overview|Table|Background|Findings|Analysis|Sources|Baseline|Part\s+\d+|Chapter\s+\d+)/i.test(
      c.title.trim()
    )
  );

  // Check for recognized standard Kanban stages (Backlog, To Do, Sprint, In Progress, Review, QA, Done, etc.)
  const standardStageRegex = /^(?:Backlog|To\s*Do|Sprint|In\s*Progress|Doing|Review|QA|Testing|Done|Completed|Archive|Blocked|Icebox|P[0-4]|Urgent)/i;
  const hasRecognizedKanbanStage = parsed.columns.some((c) => standardStageRegex.test(c.title.trim()));

  // High-fidelity native Markdown requires:
  // 1. Column count between 1 and 10 (Kanban boards have a small, focused set of lanes, never 15 or 32!)
  // 2. No report-style headings (Executive Summary, 0. ..., 1. ..., Appendix)
  // 3. Substantial proportion of checkbox task bullets (- [ ] or - [x]) OR clear recognized Kanban stage names
  // 4. Prose lines must not heavily outnumber task bullets
  const isHighConfidenceNativeMD =
    parsed.columns.length >= 1 &&
    parsed.columns.length <= 10 &&
    !hasReportHeadings &&
    tasksCount > 0 &&
    (checkboxCount > 0 || hasRecognizedKanbanStage) &&
    (checkboxCount >= tasksCount * 0.4 || (hasRecognizedKanbanStage && proseLineCount < taskBulletCount * 2));

  if (isHighConfidenceNativeMD) {
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
  if (hasReportHeadings) {
    missingReason.push('Document contains technical audit, report, or article headings (e.g. Executive Summary, Glossary, Sections)');
  }
  if (parsed.columns.length > 10) {
    missingReason.push(`Detected ${parsed.columns.length} document sections. Standard Kanban boards use 3–6 focused workflow stages.`);
  }
  if (!foundColumnHeader) {
    missingReason.push('No Kanban column headers found (e.g. ## To Do, ## In Progress, ## Done)');
  }
  if (taskBulletCount === 0 || checkboxCount === 0) {
    missingReason.push('Missing native checkbox task items (e.g. - [ ] Actionable task)');
  }
  if (proseLineCount > taskBulletCount * 2) {
    missingReason.push('Document contains unstructured narrative prose or audit notes');
  }

  const isAuditOrReport = hasReportHeadings || parsed.columns.length > 8;

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
      title: isAuditOrReport
        ? 'Technical Audit / Report Detected (Needs Conversion)'
        : 'Unstructured Document Detected (Needs Conversion)',
      message: isAuditOrReport
        ? 'This document contains comprehensive audit findings or report sections. Use the Smart Converter to structure it into standard sprint stages with actionable tasks, context metrics, and subtasks.'
        : 'This document is not in native MyKanBan format. Use the integrated Smart Converter / AI to automatically parse, structure stages, and extract tasks.',
      details: missingReason.length > 0 ? missingReason : ['Document requires stage and task structuring'],
    },
  };
}
