interface ImportMetaEnv {
  readonly UI_KIT: 'shadcn' | 'mui';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '@remote-styles';
declare module '@standalone-styles';
