type BarcodeFormat = "qr_code";

type DetectedBarcode = {
  rawValue: string;
  boundingBox?: DOMRectReadOnly;
};

declare class BarcodeDetector {
  constructor(options?: { formats?: BarcodeFormat[] });
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
}

interface Window {
  BarcodeDetector?: typeof BarcodeDetector;
}
