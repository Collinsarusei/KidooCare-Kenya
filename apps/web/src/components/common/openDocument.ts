/**
 * Opens an uploaded document in a new tab.
 * Handles legacy records that stored the file inline as a data: URL
 * (browsers block navigating to data: URLs directly).
 */
export const openDocument = (url?: string | null) => {
  if (!url) return;
  if (url.startsWith('data:')) {
    try {
      const [meta, b64] = url.split(',');
      const mime = /data:([^;]+)/.exec(meta)?.[1] || 'application/octet-stream';
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const blobUrl = URL.createObjectURL(new Blob([bytes], { type: mime }));
      window.open(blobUrl, '_blank', 'noopener');
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch {
      alert('This document could not be opened. Please ask the school to re-upload it.');
    }
    return;
  }
  window.open(url, '_blank', 'noopener');
};

export const formatFileSize = (bytes?: number | null) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/** Legacy uploads pointed at fake utfs.io URLs that were never uploaded. */
export const isBrokenLegacyUrl = (url?: string | null) => !!url && /utfs\.io\/f\/(ut-|cert-sample)/.test(url);
