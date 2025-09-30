declare module 'tesseract.js' {
  interface RecognizeResult {
    data: {
      text: string;
      confidence: number;
    };
  }

  interface TesseractWorker {
    load(): Promise<void>;
    loadLanguage(lang: string): Promise<void>;
    initialize(lang: string): Promise<void>;
    recognize(image: File | Blob | string): Promise<RecognizeResult>;
    terminate(): Promise<void>;
  }

  interface TesseractStatic {
    recognize(
      image: File | Blob | string,
      lang?: string,
      options?: any
    ): Promise<RecognizeResult>;
    createWorker(): TesseractWorker;
  }

  const Tesseract: TesseractStatic;
  export default Tesseract;
}