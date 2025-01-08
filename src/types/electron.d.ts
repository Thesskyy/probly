export {};

declare global {
  interface Window {
    electron: {
      invoke: (channel: string, data?: any) => Promise<any>;
      isElectronApp: boolean;
      showOpenDialog: () => Promise<{
        canceled: boolean;
        filePaths: string[];
      }>;
      showSaveDialog: () => Promise<{
        canceled: boolean;
        filePath?: string;
      }>;
      onFileImported: (callback: (path: string) => void) => void;
      onFileExported: (callback: (path: string) => void) => void;
      on: (channel: string, callback: (...args: any[]) => void) => void;
      removeListener: (
        channel: string,
        callback: (...args: any[]) => void,
      ) => void;
      removeAllListeners: (channel: string) => void;
    };
  }
}
