import {useMemo, useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {useAuth} from '../../contexts/AuthContext';
import {useNotifications} from '../../contexts/NotificationsContext';
import {Button} from '../ui/Button';
import {NotificationsPanel} from './NotificationsPanel';

function resolveTitle(pathname: string): string {
    if (pathname.startsWith('/документы/') && pathname.endsWith('/редактировать')) return 'Редактирование';
    if (pathname.startsWith('/документы/') && pathname !== '/документы/новый') return 'Карточка документа';
    if (pathname.startsWith('/рабочий-стол')) return 'Рабочий стол';
    if (pathname.startsWith('/документы/новый')) return 'Новый документ';
    if (pathname.startsWith('/документы')) return 'Документы';
    if (pathname.startsWith('/согласование')) return 'Согласование';
    if (pathname.startsWith('/отчётность')) return 'Отчётность';
    if (pathname.startsWith('/администрирование')) return 'Администрирование';
    return 'docu';
}

export function Topbar(): JSX.Element {
    const {pathname} = useLocation();
    const navigate = useNavigate();
    const {session, logout} = useAuth();
    const {unreadCount, open, setOpen} = useNotifications();
    const [loggingOut, setLoggingOut] = useState(false);

    const title = useMemo(() => resolveTitle(pathname), [pathname]);

    return (
        <header className="topbar">
            <div className="topbar-left">
                <div className="topbar-title">{title}</div>
            </div>

            <div className="topbar-right">
                <button
                    type="button"
                    className={`topbar-icon-button ${unreadCount > 0 ? 'topbar-icon-button-active' : ''}`}
                    onClick={() => setOpen(!open)}
                    aria-label="Оповещения"
                >
          <span className="topbar-icon-bell" role="img" aria-hidden="true">
            🔔
          </span>
                    {unreadCount > 0 ? <span className="topbar-counter">{unreadCount}</span> : null}
                </button>

                <div className="topbar-user">
                    <span className="topbar-user-name">{session?.fullName || session?.username}</span>
                </div>

                <Button variant="secondary" className="topbar-create-button"
                        onClick={() => navigate('/документы/новый')} aria-label="Новый документ">
                    +
                </Button>

                <Button
                    variant="danger"
                    className="topbar-logout-button"
                    aria-label="Выйти"
                    disabled={loggingOut}
                    onClick={() => {
                        setLoggingOut(true);
                        logout();
                        navigate('/login');
                    }}
                >
                    ↪
                </Button>
            </div>

            <NotificationsPanel/>
        </header>
    );
}