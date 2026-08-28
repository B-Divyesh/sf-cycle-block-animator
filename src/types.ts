export interface SourceFrame {
  id: string;
  name: string;
  width: number;
  height: number;
  blob: Blob;
  url: string;
}

export interface CycleBlock {
  id: string;
  start: number;
  end: number;
  repeats: number;
  offset: number;
}

export interface ProjectSettings {
  fps: number;
  maxTexture: number;
  targetKiB: number;
  padding: number;
  powerOfTwo: boolean;
}

export interface PersistedProject {
  version: 1;
  name: string;
  updatedAt: number;
  frames: Array<Omit<SourceFrame, 'url'>>;
  blocks: CycleBlock[];
  settings: ProjectSettings;
}

export interface SheetPlan {
  columns: number;
  rows: number;
  cellWidth: number;
  cellHeight: number;
  width: number;
  height: number;
  scale: number;
}
