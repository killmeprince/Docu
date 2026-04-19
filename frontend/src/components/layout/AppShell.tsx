import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppShell(): JSX.Element {
    return (
        <div className="app-shell">
            <Sidebar />
            <div className="app-main">
                <Topbar />
                <main className="app-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}