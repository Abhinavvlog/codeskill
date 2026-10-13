export interface PistonRuntime {
  language: string;
  version: string;
  aliases: string[];
  runtime?: string;
}
export interface PistonStage {
  stdout: string;
  stderr: string;
  output: string;
  code: number | null;
  signal: string | null;
  /** Optional Isolate metadata verified in pinned upstream api/src/job.js. */
  status?: string | null;
  memory?: number | null;
  cpu_time?: number | null;
  wall_time?: number | null;
}
export interface PistonResponse {
  language: string;
  version: string;
  compile?: PistonStage;
  run?: PistonStage;
}
export interface PistonRequest {
  language: string;
  version: string;
  files: Array<{ name: string; content: string }>;
  stdin: string;
  run_timeout: number;
  compile_timeout: number;
  run_memory_limit: number;
  compile_memory_limit: number;
}
export class PistonUnavailableError extends Error {
  constructor() {
    super('Code execution is temporarily unavailable. Please retry.');
  }
}
