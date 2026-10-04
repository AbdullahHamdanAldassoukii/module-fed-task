import {
  isAcceptedMimeType,
  type AcceptedMimeType,
  type PassportDocument,
} from '@repo/passport-contract';

export interface FileEncoder {
  encode(file: File, signal: AbortSignal): Promise<PassportDocument>;
}

export class FileEncodeError extends Error {
  override name = 'FileEncodeError';
}

const MIME_TYPE_BY_EXTENSION: Readonly<Record<string, AcceptedMimeType>> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
};

export function mimeTypeOf(file: Pick<File, 'name' | 'type'>): string {
  if (file.type) return file.type;
  const dot = file.name.lastIndexOf('.');
  if (dot < 0) return '';
  return MIME_TYPE_BY_EXTENSION[file.name.slice(dot + 1).toLowerCase()] ?? '';
}

const abortError = () => new DOMException('The file read was cancelled.', 'AbortError');

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export function createFileReaderEncoder(): FileEncoder {
  return {
    encode(file, signal) {
      return new Promise<PassportDocument>((resolve, reject) => {
        if (signal.aborted) {
          reject(abortError());
          return;
        }
        const mimeType = mimeTypeOf(file);
        if (!isAcceptedMimeType(mimeType)) {
          reject(new FileEncodeError(`Unsupported file type "${mimeType}"`));
          return;
        }
        const reader = new FileReader();
        const onAbort = () => {
          reader.abort();
          reject(abortError());
        };
        signal.addEventListener('abort', onAbort, { once: true });
        reader.onload = () => {
          signal.removeEventListener('abort', onAbort);
          const result = typeof reader.result === 'string' ? reader.result : '';
          const base64 = result.slice(result.indexOf(',') + 1);
          if (base64 === '') {
            reject(new FileEncodeError('The file is empty'));
            return;
          }
          resolve({ fileName: file.name, mimeType, base64 });
        };
        reader.onerror = () => {
          signal.removeEventListener('abort', onAbort);
          reject(new FileEncodeError('The file could not be read', { cause: reader.error }));
        };
        reader.readAsDataURL(file);
      });
    },
  };
}
