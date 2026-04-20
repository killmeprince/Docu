import {NavLink} from 'react-router-dom';
import {useAuth} from '../../contexts/AuthContext';

function navClass({isActive}: { isActive: boolean }): string {
    return isActive ? 'side-link side-link-active' : 'side-link';
}

export function Sidebar(): JSX.Element {
    const {session} = useAuth();
    const roles = session?.roles || [];
    const canApprove = roles.some((role) => role === 'ROLE_ADMIN' || role === 'ROLE_APPROVER');

    return (
        <aside className="sidebar">
            <nav className="side-nav">
                <NavLink to="/рабочий-стол" className={navClass}>
                    Рабочий стол
                </NavLink>
                <NavLink to="/документы" className={navClass}>
                    Документы
                </NavLink>
                {canApprove ? (
                    <NavLink to="/согласование" className={navClass}>
                        Согласование
                    </NavLink>
                ) : null}
                {canApprove ? (
                    <NavLink to="/отчётность" className={navClass}>
                        Отчётность
                    </NavLink>
                ) : null}
                {roles.includes('ROLE_ADMIN') ? (
                    <NavLink to="/администрирование" className={navClass}>
                        Админ
                    </NavLink>
                ) : null}
            </nav>
        </aside>
    );
}