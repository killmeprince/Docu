import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { getDocuments } from '../api/documents';
import { useAuth } from './AuthContext';
import type { DocumentResponse } from '../types/api';
import { formatDateTime, statusLabel } from '../lib/format';

type NotificationItem = {
    id: string;
    documentId: number;
    title: string;
    body: string;
    createdAt: string;
    read: boolean;
};

type SnapshotRecord = {
    id: number;
    updatedAt: string;
    status: string;
    title: string;
    registrationNumber: string;
};

type NotificationsContextValue = {
    items: NotificationItem[];
    unreadCount: number;
    open: boolean;
    setOpen: (value: boolean) => void;
    markAllRead: () => void;
    markRead: (id: string) => void;
    remove: (id: string) => void;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

function snapshotKey(username: string): string {
    return `docu.notifications.snapshot.${username}`;
}

function itemsKey(username: string): string {
    return `docu.notifications.items.${username}`;
}

function readSnapshot(username: string): Record<number, SnapshotRecord> {
    const raw = localStorage.getItem(snapshotKey(username));
    if (!raw) return {};
    try {
        const parsed = JSON.parse(raw) as SnapshotRecord[];
        return Object.fromEntries(parsed.map((item) => [item.id, item]));
    } catch {
        return {};
    }
}

function saveSnapshot(username: string, documents: DocumentResponse[]): void {
    const payload: SnapshotRecord[] = documents.map((item) => ({
        id: item.id,
        updatedAt: item.updatedAt,
        status: item.status,
        title: item.title,
        registrationNumber: item.registrationNumber,
    }));
    localStorage.setItem(snapshotKey(username), JSON.stringify(payload));
}

function readItems(username: string): NotificationItem[] {
    const raw = localStorage.getItem(itemsKey(username));
    if (!raw) return [];
    try {
        return JSON.parse(raw) as NotificationItem[];
    } catch {
        return [];
    }
}

function saveItems(username: string, items: NotificationItem[]): void {
    localStorage.setItem(itemsKey(username), JSON.stringify(items));
}

function makeNewDocumentNotification(document: DocumentResponse): NotificationItem | null {
    if (document.status !== 'IN_APPROVAL') {
        return null;
    }

    return {
        id: `new:${document.id}:${document.updatedAt}`,
        documentId: document.id,
        title: 'Новый документ',
        body: `${document.registrationNumber} · ${document.title}`,
        createdAt: document.updatedAt,
        read: false,
    };
}

function makeChangedDocumentNotification(
    previous: SnapshotRecord,
    current: DocumentResponse,
    username: string,
): NotificationItem | null {
    if (previous.status !== current.status) {
        return {
            id: `status:${current.id}:${current.updatedAt}`,
            documentId: current.id,
            title: 'Изменение статуса',
            body: `${current.registrationNumber} · ${statusLabel(previous.status)} → ${statusLabel(current.status)}`,
            createdAt: current.updatedAt,
            read: false,
        };
    }

    if (previous.updatedAt !== current.updatedAt && current.authorUsername !== username) {
        return {
            id: `update:${current.id}:${current.updatedAt}`,
            documentId: current.id,
            title: 'Обновление документа',
            body: `${current.registrationNumber} · ${current.title}`,
            createdAt: current.updatedAt,
            read: false,
        };
    }

    return null;
}

export function NotificationsProvider({
                                          children,
                                      }: {
    children: React.ReactNode;
}): JSX.Element {
    const { session } = useAuth();
    const [items, setItems] = useState<NotificationItem[]>([]);
    const [open, setOpen] = useState(false);
    const initializedRef = useRef(false);

    useEffect(() => {
        if (!session) {
            setItems([]);
            setOpen(false);
            initializedRef.current = false;
            return;
        }

        const username = session.username;
        setItems(readItems(username));

        let cancelled = false;

        async function poll(): Promise<void> {
            if (!session) return;

            const documents = await getDocuments(session.token);
            if (cancelled) return;

            const previousSnapshot = readSnapshot(username);
            const nextSnapshot = Object.keys(previousSnapshot).length === 0;

            if (nextSnapshot && !initializedRef.current) {
                saveSnapshot(username, documents);
                initializedRef.current = true;
                return;
            }

            const created: NotificationItem[] = [];

            documents.forEach((document) => {
                const previous = previousSnapshot[document.id];
                if (!previous) {
                    const notification = makeNewDocumentNotification(document);
                    if (notification) {
                        created.push(notification);
                    }
                    return;
                }

                const changed = makeChangedDocumentNotification(previous, document, username);
                if (changed) {
                    created.push(changed);
                }
            });

            if (created.length > 0) {
                setItems((current) => {
                    const knownIds = new Set(current.map((item) => item.id));
                    const merged = [...created.filter((item) => !knownIds.has(item.id)), ...current].slice(0, 40);
                    saveItems(username, merged);
                    return merged;
                });
            }

            saveSnapshot(username, documents);
            initializedRef.current = true;
        }

        void poll();
        const timer = window.setInterval(() => {
            void poll();
        }, 30000);

        return () => {
            cancelled = true;
            window.clearInterval(timer);
        };
    }, [session]);

    const value = useMemo<NotificationsContextValue>(() => {
        const username = session?.username;

        return {
            items,
            unreadCount: items.filter((item) => !item.read).length,
            open,
            setOpen(value) {
                setOpen(value);
            },
            markAllRead() {
                setItems((current) => {
                    const next = current.map((item) => ({ ...item, read: true }));
                    if (username) saveItems(username, next);
                    return next;
                });
            },
            markRead(id) {
                setItems((current) => {
                    const next = current.map((item) => (item.id === id ? { ...item, read: true } : item));
                    if (username) saveItems(username, next);
                    return next;
                });
            },
            remove(id) {
                setItems((current) => {
                    const next = current.filter((item) => item.id !== id);
                    if (username) saveItems(username, next);
                    return next;
                });
            },
        };
    }, [items, open, session?.username]);

    return (
        <NotificationsContext.Provider value={value}>
            {children}
        </NotificationsContext.Provider>
    );
}

export function useNotifications(): NotificationsContextValue {
    const value = useContext(NotificationsContext);
    if (!value) {
        throw new Error('NotificationsContext не инициализирован');
    }
    return value;
}

export function notificationDateLabel(value: string): string {
    return formatDateTime(value);
}