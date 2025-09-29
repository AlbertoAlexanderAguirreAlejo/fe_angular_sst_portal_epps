export function imageSrcFromBase64(b64?: string): string {
  return b64 ? `data:image/png;base64,${b64}` : '';
}
