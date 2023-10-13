export interface Point {
  x:number;
  y:number;
}

export interface Rect {
  left:number;
  right:number;
  top:number;
  bottom:number;
  width:number;
  height:number;
}

export interface PerformanceMetrics {
  fileNumber:number;
  correctFilesNumber:number;
  averageTime:number;
  score:number;
}

export interface EngineStatistics {
  name: string;
  metrics: PerformanceMetrics;
  rows?:EngineDataTableRow[];
}

export interface EngineDataTableRow {
  number: number;
  filename: string;
  groundTruth: string;
  detectedText: string;
  time: string;
  score: number;
}