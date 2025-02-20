export interface PyodideInterface {
  runPython(code: string): any;
  runPythonAsync(code: string): Promise<any>;
  loadPackage(packages: string | string[]): Promise<any>;
  globals: {
    get(key: string): any;
    set(key: string, value: any): void;
  };
  setStdout(options: { batched: (msg: string) => void }): void;
  setStderr(options: { batched: (msg: string) => void }): void;
}

declare global {
  interface Window {
    loadPyodide(options?: { indexURL?: string }): Promise<PyodideInterface>;
  }
}

// For Node environment
declare module 'pyodide' {
  export function loadPyodide(options?: { indexURL?: string }): Promise<PyodideInterface>;
}