export {};

declare global {
  interface Window {
    electron: {
      invoke: (channel: string, data: any) => Promise<any>;
      isElectron: boolean;
    };
  }
}
