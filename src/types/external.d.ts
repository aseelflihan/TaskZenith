// Type definitions for external libraries

declare module 'zustand' {
  import { StateCreator, UseBoundStore } from 'zustand/vanilla';
  
  export function create<T>(
    createState: StateCreator<T, [], [], T>
  ): UseBoundStore<T>;
}

declare module 'lenis/react' {
  import { ReactNode } from 'react';
  
  export const ReactLenis: React.ComponentType<{
    children: ReactNode;
    options?: any;
  }>;
  
  export function useLenis(callback?: (lenis: any) => void): any;
}

declare module '@splinetool/react-spline' {
  import { ComponentProps } from 'react';
  
  interface SplineProps {
    scene: string;
    onLoad?: () => void;
    onError?: (error: Error) => void;
    style?: React.CSSProperties;
    className?: string;
  }
  
  const Spline: React.ComponentType<SplineProps>;
  export default Spline;
}

declare module 'pdf2json' {
  class PDFParser {
    constructor();
    parseBuffer(buffer: Buffer): Promise<any>;
    getRawTextContent(): string;
    on(event: string, callback: (data: any) => void): void;
  }
  export default PDFParser;
}

declare module 'mammoth' {
  export function extractRawText(input: { buffer: Buffer }): Promise<{ value: string }>;
  export function convertToHtml(input: { buffer: Buffer }): Promise<{ value: string }>;
}

declare module 'xlsx' {
  export interface WorkBook {
    SheetNames: string[];
    Sheets: { [key: string]: WorkSheet };
  }
  
  export interface WorkSheet {
    [key: string]: any;
    '!ref'?: string;
  }
  
  export const utils: {
    decode_range(range: string): { s: { r: number; c: number }; e: { r: number; c: number } };
    sheet_to_csv(worksheet: WorkSheet): string;
  };
  
  export function read(data: Buffer, options?: any): WorkBook;
}

declare module 'tesseract.js' {
  export function createWorker(): {
    load(): Promise<void>;
    loadLanguage(lang: string): Promise<void>;
    initialize(lang: string): Promise<void>;
    recognize(image: string | Buffer): Promise<{ data: { text: string } }>;
    terminate(): Promise<void>;
  };
}

declare module '@genkit-ai/flow' {
  export function defineFlow<T, U>(config: {
    name: string;
    inputSchema?: any;
    outputSchema?: any;
  }, fn: (input: T) => Promise<U>): any;
}
