const PNG_DATA_PREFIX = 'data:image/png;base64,';

/** Decode a project-embedded PNG without issuing a fetch request.
 *
 * Data URLs used to be restored through fetch(), which makes the decode subject
 * to connect-src and breaks under the production CSP. This conversion is wholly
 * local and accepts only the format written by the project exporter.
 */
export function pngDataUrlToBlob(dataUrl: string): Blob {
  if (!dataUrl.toLowerCase().startsWith(PNG_DATA_PREFIX)) {
    throw new Error('A source frame in this project is not an embedded PNG.');
  }

  const encoded = dataUrl.slice(PNG_DATA_PREFIX.length);
  if (!encoded || !/^[a-z0-9+/]*={0,2}$/i.test(encoded) || encoded.length % 4 !== 0) {
    throw new Error('A source frame in this project has invalid PNG data.');
  }

  try {
    const binary = atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return new Blob([bytes], { type: 'image/png' });
  } catch {
    throw new Error('A source frame in this project has invalid PNG data.');
  }
}
