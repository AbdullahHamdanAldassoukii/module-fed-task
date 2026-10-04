import { Skeleton } from '@repo/ui';
import { useEffect, useState } from 'react';
import { M, useT } from '../../lib/i18n';

export function LoadingSlot() {
  const { t } = useT();
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setSlow(true), 3_000);
    return () => clearTimeout(id);
  }, []);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Skeleton height={420} label={t(M.remote.loading)} />
      {slow ? (
        <p role="status" style={{ fontSize: 13, opacity: 0.8 }}>
          {t(M.remote.stillLoading)}
        </p>
      ) : null}
    </div>
  );
}
