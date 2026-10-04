export interface RemoteModuleLoader<T> {
  load(): Promise<T>;
  reset(): void;
}
