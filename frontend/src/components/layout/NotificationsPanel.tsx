import { useNavigate } from 'react-router-dom';
import { useNotifications, notificationDateLabel } from '../../contexts/NotificationsContext';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';

export function NotificationsPanel(): JSX.Element | null {
    const navigate = useNavigate();
    const { items, open, setOpen, markAllRead, markRead } = useNotifications();

    if (!open) {
        return null;
    }

    return (
        <div className="notifications-panel">
            <div className="notifications-panel-header">
                <div className="notifications-panel-title">Оповещения</div>
                <Button
                    variant="ghost"
                    onClick={() => {
                        markAllRead();
                    }}
                >
                    Прочитано
                </Button>
            </div>

            {items.length === 0 ? (
                <EmptyState title="Пусто" description="Новых событий нет." />
            ) : (
                <div className="notifications-list">
                    {items.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            className={`notification-card ${!item.read ? 'notification-card-unread' : ''}`}
                            onClick={() => {
                                markRead(item.id);
                                setOpen(false);
                                navigate(`/документы/${item.documentId}`);
                            }}
                        >
                            <div className="notification-card-head">
                                <div className="notification-card-title">{item.title}</div>
                                <div className="notification-card-date">{notificationDateLabel(item.createdAt)}</div>
                            </div>
                            <div className="notification-card-body">{item.body}</div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}