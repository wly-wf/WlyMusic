declare global {
  interface Window {
    electronAPI?: {
      sendToRust: (command: string) => Promise<unknown>;
    };
  }
}

export {};