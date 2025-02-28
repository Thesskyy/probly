declare module 'handsontable' {
  // Define the Handsontable class/interface
  interface HandsontableInstance {
    // Add any methods or properties you need to use
    updateSettings(settings: any): void;
    getData(): any[][];
    render(): void;
    destroy(): void;
    // Add other methods as needed
  }

  // Define the constructor function
  interface HandsontableStatic {
    new (element: HTMLElement, options: any): HandsontableInstance;
  }

  // Export the namespace and default
  const Handsontable: HandsontableStatic;
  export = Handsontable;
} 