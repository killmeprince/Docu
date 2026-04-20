import {createBrowserRouter, Navigate} from 'react-router-dom';
import {AppShell} from '../components/layout/AppShell';
import {RequireAuth} from '../components/auth/RequireAuth';
import {RequireRole} from '../components/auth/RequireRole';
import {LoginPage} from '../pages/LoginPage';
import {DashboardPage} from '../pages/DashboardPage';
import {DocumentsPage} from '../pages/DocumentsPage';
import {DocumentEditorPage} from '../pages/DocumentEditorPage';
import {DocumentDetailsPage} from '../pages/DocumentDetailsPage';
import {ApprovalInboxPage} from '../pages/ApprovalInboxPage';
import {ReportsPage} from '../pages/ReportsPage';
import {AdminPage} from '../pages/AdminPage';

export const router = createBrowserRouter([
    {
        path: '/login',
        element: <LoginPage/>,
    },
    {
        path: '/',
        element: (
            <RequireAuth>
                <AppShell/>
            </RequireAuth>
        ),
        children: [
            {index: true, element: <Navigate to="/рабочий-стол" replace/>},
            {path: 'рабочий-стол', element: <DashboardPage/>},
            {path: 'документы', element: <DocumentsPage/>},
            {path: 'документы/новый', element: <DocumentEditorPage mode="create"/>},
            {path: 'документы/:documentId', element: <DocumentDetailsPage/>},
            {path: 'документы/:documentId/редактировать', element: <DocumentEditorPage mode="edit"/>},
            {
                path: 'согласование',
                element: (
                    <RequireRole roles={["ROLE_ADMIN", "ROLE_APPROVER"]}>
                        <ApprovalInboxPage/>
                    </RequireRole>
                ),
            },
            {
                path: 'отчётность',
                element: (
                    <RequireRole roles={["ROLE_ADMIN", "ROLE_APPROVER"]}>
                        <ReportsPage/>
                    </RequireRole>
                ),
            },
            {
                path: 'администрирование',
                element: (
                    <RequireRole roles={["ROLE_ADMIN"]}>
                        <AdminPage/>
                    </RequireRole>
                ),
            },
        ],
    },
    {path: '*', element: <Navigate to="/" replace/>},
]);
