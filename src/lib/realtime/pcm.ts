export function encodePcm16(samples: Float32Array): string {
  const bytes = new Uint8Array(samples.length * 2);
  const view = new DataView(bytes.buffer);
  for (let index = 0; index < samples.length; index++) {
    const value = Math.max(-1, Math.min(1, samples[index]));
    view.setInt16(index * 2, value < 0 ? value * 32768 : value * 32767, true);
  }
  let text = "";
  for (let index = 0; index < bytes.length; index++)
    text += String.fromCharCode(bytes[index]);
  return btoa(text);
}
export function decodePcm16(value: string): Float32Array {
  const text = atob(value);
  const bytes = Uint8Array.from(text, (char) => char.charCodeAt(0));
  const view = new DataView(bytes.buffer);
  const samples = new Float32Array(Math.floor(bytes.length / 2));
  for (let index = 0; index < samples.length; index++)
    samples[index] = view.getInt16(index * 2, true) / 32768;
  return samples;
}
