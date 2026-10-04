import { RetryPlugin } from '@module-federation/retry-plugin';

export default function retryPlugin() {
  return RetryPlugin({ retryTimes: 3, retryDelay: 800 });
}
