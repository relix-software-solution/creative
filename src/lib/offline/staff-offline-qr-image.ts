import QRCode from "qrcode";

export async function createOfflineQrImageDataUrl(token: string) {
  return QRCode.toDataURL(token, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 512,
  });
}
