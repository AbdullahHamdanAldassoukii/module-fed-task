import '@standalone-styles';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { StandalonePage } from './standalone/StandalonePage';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StandalonePage />
  </StrictMode>,
);
