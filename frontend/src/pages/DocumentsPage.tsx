import {useCallback, useEffect, useRef, useState} from 'react';
import {useAuth} from '../contexts/AuthContext';
import {getDocuments, sendDocumentToApproval} from '../api/documents';
import type {DocumentResponse, DocumentsFilter} from '../types/api';
import {WindowCard} from '../components/layout/WindowCard';
import {DocumentFilters} from '../components/documents/DocumentFilters';
import {DocumentTable} from '../components/documents/DocumentTable';
import {EmptyState} from '../components/ui/EmptyState';

export function DocumentsPage(): JSX.Element {
    const {session} = useAuth();
    const [filters, setFilters] = useState<DocumentsFilter>({});
    const [documents, setDocuments] = useState<DocumentResponse[]>([]);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const requestSequence = useRef(0);

    const load = useCallback(async (activeFilters: DocumentsFilter): Promise<void> => {
        if (!session) {
            return;
        }

        const requestId = ++requestSequence.current;
        setIsLoading(true);

        try {
            const data = await getDocuments(session.token, activeFilters);

            if (requestId === requestSequence.current) {
                setDocuments(data);
            }
        } finally {
            if (requestId === requestSequence.current) {
                setIsLoading(false);
            }
        }
    }, [session]);

    useEffect(() => {
        if (!session) {
            return;
        }

        const timer = window.setTimeout(() => {
            void load(filters);
        }, 240);

        return () => window.clearTimeout(timer);
    }, [session, filters, load]);

    return (
        <div className="page-grid">
            <WindowCard
                className="documents-window-card"
                title="Список документов"
                subtitle="Живой поиск и аккуратная работа со списком без перезагрузки."
                actions={(
                    <div className="documents-page-meta">
                        {isLoading ? 'Обновляем…' : `Найдено: ${documents.length}`}
                    </div>
                )}
            >
                <DocumentFilters
                    value={filters}
                    onChange={setFilters}
                    open={isSearchOpen}
                    onToggle={() => setIsSearchOpen((prev) => !prev)}
                />

                {!documents.length ? (
                    isLoading ? (
                        <div className="documents-loading-state">
                            Загружаем список документов…
                        </div>
                    ) : (
                        <EmptyState
                            title="Документы не найдены"
                            description=""
                        />
                    )
                ) : (
                    <>
                        {isLoading ? (
                            <div className="documents-refresh-hint">
                                Список обновляется…
                            </div>
                        ) : null}

                        <DocumentTable
                            documents={documents}
                            onSend={(documentId) => session
                                ? void sendDocumentToApproval(session.token, documentId).then(() => load(filters))
                                : undefined}
                        />
                    </>
                )}
            </WindowCard>
        </div>
    );
}