import QRCode from "qrcode";

export async function createOfflineQrImageDataUrl(
  qrToken: string,
): Promise<string> {
  const token = qrToken.trim();

  if (!token) {
    throw new Error("QR_TOKEN_IS_REQUIRED");
  }

  return QRCode.toDataURL(token, {
    /*
     * أقل كثافة ممكنة.
     * مناسبة عندما تكون الطباعة واضحة ونظيفة.
     */
    errorCorrectionLevel: "L",

    /*
     * المنطقة البيضاء المحيطة بالرمز.
     * لا تقللها عن 3.
     */
    margin: 4,

    /*
     * دقة الصورة فقط، وليست كثافة المعلومات.
     */
    width: 768,

    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });
}
