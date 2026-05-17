export type SupportedLanguage = 'python' | 'sql' | 'javascript' | 'html' | 'ruby' | 'cpp' | 'r';

export interface CourseVideo {
  id: string; // YouTube video ID
  title: string;
  durationFormatted: string;
  durationSeconds: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  playlistId?: string;
  videos: CourseVideo[];
  defaultLanguage: SupportedLanguage;
  initialCode?: string;
  initialNotebook?: NotebookCell[];
}

export interface VideoProgress {
  currentTimeSeconds: number;
  durationSeconds: number;
  completed: boolean;
}

export interface NotebookCell {
  id: string;
  type: 'code' | 'markdown';
  content: string;
  output?: string;
  error?: boolean;
}

export interface VirtualFile {
  name: string;
  data: Uint8Array;
  sizeFormatted: string;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  executionTimeMs: number;
  error?: boolean;
  // Special typed outputs for rich representation
  sqlResult?: { columns: string[]; values: any[][] }[];
  htmlPreview?: string;
  cellId?: string; // For notebook partial evaluations
  plots?: string[]; // Array of Base64 encoded Matplotlib/analytics image figures
}

export interface WorkspaceFile {
  id: string;
  name: string;
  language: SupportedLanguage;
  content: string;
}
