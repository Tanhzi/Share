// Web clipboard implementation using Clipboard API

export const setString = async (text: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.style.width = '1px';
    textArea.style.height = '1px';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (fallbackErr) {
      console.error('Failed to copy text:', fallbackErr);
      throw fallbackErr;
    } finally {
      document.body.removeChild(textArea);
    }
  }
};

export const getString = async (): Promise<string> => {
  try {
    return await navigator.clipboard.readText();
  } catch (err) {
    console.error('Failed to read clipboard:', err);
    return '';
  }
};

export const copyImage = async (blob: Blob): Promise<void> => {
  try {
    const item = new ClipboardItem({ [blob.type]: blob });
    await navigator.clipboard.write([item]);
  } catch (err) {
    console.error('Failed to copy image:', err);
    throw err;
  }
};

export const supportsClipboard = (): boolean => {
  return 'clipboard' in navigator;
};

export const supportsWriteText = (): boolean => {
  return 'clipboard' in navigator && 'writeText' in navigator.clipboard;
};
