import type { FileFieldFile } from '@repo/ui';
import type { DocumentValue } from '../model';

function decodedSize(base64: string): number {
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return (base64.length / 4) * 3 - padding;
}

export function documentChip(value: DocumentValue): FileFieldFile | null {
  switch (value.status) {
    case 'reading':
      return { name: value.fileName, mimeType: value.mimeType, sizeBytes: value.sizeBytes };
    case 'ready': {
      const { fileName, mimeType, base64 } = value.document;
      return {
        name: fileName,
        mimeType,
        sizeBytes: decodedSize(base64),
        previewUrl: mimeType.startsWith('image/') ? `data:${mimeType};base64,${base64}` : undefined,
      };
    }
    case 'empty':
    case 'rejected':
      return null;
  }
}
