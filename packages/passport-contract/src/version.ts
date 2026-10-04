export const PASSPORT_FORM_CONTRACT_VERSION = '1.0.0';

const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;

export function isCompatibleContractVersion(remoteVersion: unknown): boolean {
  if (typeof remoteVersion !== 'string') return false;
  const remote = SEMVER.exec(remoteVersion);
  const local = SEMVER.exec(PASSPORT_FORM_CONTRACT_VERSION);
  if (!remote || !local) return false;
  return remote[1] === local[1];
}
