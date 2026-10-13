import { formatBytes } from '../../src/utils/format';

describe('formatBytes', () => {
  it('formats bytes correctly', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
    expect(formatBytes(1)).toBe('1 Bytes');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1048576)).toBe('1 MB');
    expect(formatBytes(1073741824)).toBe('1 GB');
  });

  it('handles invalid input', () => {
    expect(formatBytes(NaN)).toBe('0 Bytes');
    expect(formatBytes(-1)).toBe('0 Bytes');
    expect(formatBytes('invalid' as any)).toBe('0 Bytes');
  });

  it('formats with correct decimal places', () => {
    expect(formatBytes(1536, 2)).toBe('1.5 KB');
    expect(formatBytes(1572864, 2)).toBe('1.5 MB');
  });

  it('handles edge cases', () => {
    expect(formatBytes(1023)).toBe('1023 Bytes');
    expect(formatBytes(1025)).toBe('1 KB');
  });
});
