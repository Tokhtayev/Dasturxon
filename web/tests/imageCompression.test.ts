import { describe, expect, it } from 'vitest';
import { MAX_IMAGE_FILE_BYTES } from '../src/services/constants';
import { computeScaledDimensions, validateImageFile } from '../src/services/imageCompression';

describe('imageCompression', () => {
  it('validateImageFile rejects non-image files, empty files, and files over 5 MB', () => {
    expect(() => validateImageFile({ size: 1024, type: 'application/pdf' })).toThrow('Faqat rasm');
    expect(() => validateImageFile({ size: 0, type: 'image/jpeg' })).toThrow("bo'sh");
    expect(() => validateImageFile({ size: MAX_IMAGE_FILE_BYTES + 1, type: 'image/jpeg' })).toThrow(
      '5 MB'
    );
    expect(() =>
      validateImageFile({ size: MAX_IMAGE_FILE_BYTES, type: 'image/png' })
    ).not.toThrow();
  });

  it('computeScaledDimensions preserves small dimensions and scales large images to <= 800px', () => {
    expect(computeScaledDimensions(640, 480)).toEqual({ width: 640, height: 480 });
    expect(computeScaledDimensions(1600, 800)).toEqual({ width: 800, height: 400 });
    expect(computeScaledDimensions(1000, 2000)).toEqual({ width: 400, height: 800 });
  });
});
