export interface EngineResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface Engine<TInput, TOutput> {
  readonly name: string;
  run(input: TInput): Promise<EngineResult<TOutput>>;
}
