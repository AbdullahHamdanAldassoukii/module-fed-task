import { createMiddleware } from '@mswjs/http-middleware';
import express from 'express';
import { handlers } from './handlers';
import { SCENARIO_HEADER, type Scenario } from './scenarios';

const port = Number(process.env.PORT ?? 3002);
const NETWORK_ERROR: Scenario = 'network-error';
const app = express();

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    `content-type, idempotency-key, ${SCENARIO_HEADER}, x-request-id, accept-language`,
  );
  res.setHeader('Access-Control-Expose-Headers', 'x-request-id');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});
app.get('/health', (_req, res) => {
  res.json({ ok: true });
});
app.use((req, _res, next) => {
  if (req.get(SCENARIO_HEADER) === NETWORK_ERROR) {
    // Node cannot send MSW's status-zero network error.
    req.socket.destroy();
    return;
  }
  next();
});
app.use(createMiddleware(...handlers));

app.listen(port, (error) => {
  if (error) {
    console.error(`mock-api could not listen on port ${port}:`, error.message);
    process.exit(1);
  }
  console.log(`mock-api listening on http://localhost:${port}`);
});
