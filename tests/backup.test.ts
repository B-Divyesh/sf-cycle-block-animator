import { describe, expect, it, vi } from 'vitest';
import { pngDataUrlToBlob } from '../src/backup';

describe('project backup frame decoding', () => {
  it('decodes an embedded PNG locally without fetch', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const blob = pngDataUrlToBlob('data:image/png;base64,iVBORw0KGgo=');

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(blob.type).toBe('image/png');
    expect(Array.from(new Uint8Array(await blob.arrayBuffer()))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    fetchSpy.mockRestore();
  });

  it('rejects remote, non-PNG, and malformed frame payloads', () => {
    expect(() => pngDataUrlToBlob('https://example.test/frame.png')).toThrow('not an embedded PNG');
    expect(() => pngDataUrlToBlob('data:text/plain;base64,aGVsbG8=')).toThrow('not an embedded PNG');
    expect(() => pngDataUrlToBlob('data:image/png;base64,%%%')).toThrow('invalid PNG data');
  });
});
