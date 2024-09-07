export enum DiffMethod {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  NEW = 'NEW',
}

export interface TextDiffSettings {
  liveEdit?: boolean;
  unifiedDiff?: boolean;
  collapseLines?: boolean;
  language?: string;
  highlightMode?: 'line' | 'character';
}

export interface TextDiffData {
  originalText?: string;
  modifiedText?: string;
  diffed?: boolean;
  settings?: TextDiffSettings;
}

export interface TextDiff extends Diff<TextDiffData> {
  method: DiffMethod.TEXT;
}

export interface ImageDiff
  extends Diff<{
    originalSrc: string;
    modifiedSrc: string;
    originalFile: File | null;
    modifiedFile: File | null;
  }> {
  method: DiffMethod.IMAGE;
}

export interface NewDiff extends Diff<never> {
  method: DiffMethod.NEW;
}

export interface Diff<T> {
  diffId: string;
  title: string;
  data?: T;
  method: DiffMethod;
}

export type DiffType = TextDiff | ImageDiff | NewDiff;
