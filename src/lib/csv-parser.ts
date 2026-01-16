import type { Script } from '@/types/video-job';

export interface CSVRow {
  title?: string;
  script: string;
}

export function validateCSV(data: any[]): { valid: boolean; error?: string } {
  if (!data || data.length === 0) {
    return { valid: false, error: 'CSV file is empty' };
  }

  // Check if 'script' column exists
  const firstRow = data[0];
  if (!firstRow || !('script' in firstRow)) {
    return {
      valid: false,
      error: 'CSV must contain a "script" column',
    };
  }

  // Check for empty scripts
  const emptyScripts = data.filter((row) => !row.script || !row.script.trim());
  if (emptyScripts.length > 0) {
    return {
      valid: false,
      error: `Found ${emptyScripts.length} empty script(s). All scripts must have content.`,
    };
  }

  return { valid: true };
}

export function parseCSVToScripts(data: CSVRow[]): Script[] {
  return data
    .filter((row) => row.script && row.script.trim())
    .map((row, index) => ({
      id: crypto.randomUUID(),
      title: row.title?.trim() || `Video ${index + 1}`,
      text: row.script.trim(),
      createdAt: new Date(),
    }));
}
