/// <reference types="@rsbuild/core/types" />

interface ImportMetaEnv {
  readonly UI_KIT: 'shadcn' | 'mui';
  readonly REMOTE_MANIFEST_URL: string;
}

declare module '@app-styles';
