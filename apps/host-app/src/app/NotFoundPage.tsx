import { Link } from 'react-router';
import { useEffect } from 'react';
import { M, useT } from '../lib/i18n';

export function NotFoundPage() {
  const { t } = useT();

  useEffect(() => {
    document.title = `${t(M.notFound.title)} · ${t(M.app.title)}`;
  }, [t]);

  return (
    <section style={{ padding: 24 }}>
      <h1>{t(M.notFound.title)}</h1>
      <p>{t(M.notFound.body)}</p>
      <Link to="/">{t(M.notFound.home)}</Link>
    </section>
  );
}
