import { PyodideInterface } from '@/types/pyodide';

interface SandboxResult {
  stdout: string;
  stderr: string;
  result: any;
}

export class PyodideSandbox {
  private pyodide: any = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Only try to load Pyodide in browser environments
      if (typeof window !== 'undefined') {
        // Browser environment - load from CDN
        // @ts-ignore - loadPyodide is loaded from a script tag
        this.pyodide = await loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.2/full/'
        });
        
        // Initialize Python environment
        await this.pyodide.loadPackagesFromImports(`
          import pandas as pd
          import numpy as np
          import matplotlib.pyplot as plt
          import io
          import base64
        `);
        
        this.initialized = true;
      } else {
        // In Node.js environment (including Docker), we'll use a mock implementation
        console.log("Running in Node.js environment - using mock Pyodide implementation");
        this.mockPyodideImplementation();
        this.initialized = true;
      }
    } catch (error) {
      console.error('Failed to initialize Pyodide:', error);
      throw error;
    }
  }

  // Create a mock implementation for server-side rendering
  private mockPyodideImplementation() {
    console.log("Creating mock Pyodide implementation for server-side rendering");
    this.pyodide = {
      runPython: (code: string) => {
        console.log("[Server] Mock Pyodide runPython called - this would run in browser");
        return null;
      },
      runPythonAsync: async (code: string) => {
        console.log("[Server] Mock Pyodide runPythonAsync called - this would run in browser");
        return null;
      },
      setStdout: (options: { batched: (s: string) => void }) => {
        console.log("[Server] Mock Pyodide setStdout called");
      },
      setStderr: (options: { batched: (s: string) => void }) => {
        console.log("[Server] Mock Pyodide setStderr called");
      }
    };
  }

  async runDataAnalysis(
    code: string, 
    csvData: string, 
    timeout: number = 5000
  ): Promise<SandboxResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.pyodide) {
      throw new Error('Pyodide not initialized');
    }

    // If we're in a server environment, return a mock result
    if (typeof window === 'undefined') {
      console.log("[Server] Returning mock analysis result - actual analysis will run in browser");
      return {
        stdout: "Pyodide analysis is only available in browser environments.\nServer received code:\n" + code,
        stderr: "",
        result: null
      };
    }

    const stdout: string[] = [];
    const stderr: string[] = [];

    this.pyodide.setStdout({ batched: (s: string) => stdout.push(s) });
    this.pyodide.setStderr({ batched: (s: string) => stderr.push(s) });

    try {
      // First, set up the data
      const setupCode = `
import io
import pandas as pd
import numpy as np

# Read the input data
df = pd.read_csv(io.StringIO('''${csvData}'''))
`;
      await this.pyodide.runPython(setupCode);

      // Then run the analysis code
      const result = await Promise.race([
        this.pyodide.runPythonAsync(code),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Analysis timeout')), timeout)
        )
      ]);

      return {
        stdout: stdout.join(''),
        stderr: stderr.join(''),
        result
      };
    } catch (error) {
      return {
        stdout: stdout.join(''),
        stderr: `Error in data analysis: ${(error as Error).message}`,
        result: null
      };
    }
  }

  async destroy(): Promise<void> {
    if (this.pyodide && typeof window !== 'undefined') {
      try {
        // Simple cleanup - just delete our main DataFrame
        await this.pyodide.runPython(`
if 'df' in globals():
    del df
`);
      } catch (error) {
        console.warn('Error during cleanup:', error);
      }
    }
    this.pyodide = null;
    this.initialized = false;
  }
}