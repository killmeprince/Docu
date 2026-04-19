import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getDocuments, sendDocumentToApproval } from '../api/documents';
import type { DocumentResponse, DocumentsFilter } from '../types/api';
import { WindowCard } from '../components/layout/WindowCard';
import { DocumentFilters } from '../components/documents/DocumentFilters';
import { DocumentTable } from '../components/documents/DocumentTable';
import { EmptyState } from '../components/ui/EmptyState';

export function DocumentsPage(): JSX.Element {
  const { session } = useAuth();
  const [filters, setFilters] = useState<DocumentsFilter>({});
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);

  async function load(): Promise<void> {
    if (!session) return;
    const data = await getDocuments(session.token, filters);
    setDocuments(data);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  return (
    <div className="page-grid">
      <WindowCard title="Реестр документов" subtitle="Поиск, фильтрация и запуск ключевых действий по документам.">
        <DocumentFilters value={filters} onChange={setFilters} onSubmit={() => void load()} />
      </WindowCard>

      <WindowCard title="Список документов" subtitle="Рабочая область для инициатора, согласующего и администратора.">
        {!documents.length ? (
          <EmptyState title="Документы не найдены" description="Измени фильтры или создай новый документ." />
        ) : (
          <DocumentTable documents={documents} onSend={(documentId) => session ? void sendDocumentToApproval(session.token, documentId).then(load) : undefined} />
        )}
      </WindowCard>
    </div>
  );
}
