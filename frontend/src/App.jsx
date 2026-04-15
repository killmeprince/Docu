import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

async function api(path, method = 'GET', token, body, isForm = false) {
    const res = await fetch(`${API}${path}`, {
        method,
        headers: isForm ? { Authorization: `Bearer ${token}` } : { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
        body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Request failed');
    const text = await res.text();
    return text ? JSON.parse(text) : null;
}

export default function App() {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(localStorage.getItem('user') || '');
    const [roles, setRoles] = useState(JSON.parse(localStorage.getItem('roles') || '[]'));
    const [docs, setDocs] = useState([]);
    const [types, setTypes] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [report, setReport] = useState(null);
    const [audit, setAudit] = useState([]);

    const [login, setLogin] = useState({ username: 'employee', password: 'password123' });
    const [form, setForm] = useState({ documentTypeId: 1, registrationNumber: '', title: '', description: '', changeComment: 'Initial' });
    const [filters, setFilters] = useState({ registrationNumber: '', status: '' });

    const load = async () => {
        if (!token) return;
        const [d, t, r] = await Promise.all([
            api(`/documents?registrationNumber=${filters.registrationNumber}&status=${filters.status}`, 'GET', token),
            roles.includes('ROLE_ADMIN') ? api('/admin/document-types', 'GET', token) : Promise.resolve([]),
            api('/reports/summary', 'GET', token),
        ]);
        setDocs(d);
        setTypes(t);
        setReport(r);
    };

    useEffect(() => { load().catch(() => {}); }, [token]);

    const doLogin = async () => {
        const data = await api('/auth/login', 'POST', null, login);
        setToken(data.token);
        setUser(data.username);
        setRoles(data.roles);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', data.username);
        localStorage.setItem('roles', JSON.stringify(data.roles));
    };

    const createDoc = async () => {
        const fd = new FormData();
        fd.append('payload', new Blob([JSON.stringify(form)], { type: 'application/json' }));
        await api('/documents', 'POST', token, fd, true);
        await load();
    };

    const sendApproval = async (id) => { await api(`/documents/${id}/send-to-approval`, 'POST', token); await load(); };
    const approve = async (stepId, decision) => { await api(`/approvals/steps/${stepId}/decision`, 'POST', token, { decision, comment: '' }); await load(); };

    const openDoc = async (id) => {
        setSelectedId(id);
        setAudit(await api(`/audit/documents/${id}`, 'GET', token));
    };

    if (!token) {
        return <div style={{padding:20}}><h2>Login</h2><input value={login.username} onChange={e=>setLogin({...login,username:e.target.value})}/><input type='password' value={login.password} onChange={e=>setLogin({...login,password:e.target.value})}/><button onClick={doLogin}>Sign in</button></div>;
    }

    return <div style={{padding:20,fontFamily:'sans-serif'}}>
        <h2>Docu MVP ({user})</h2>
        <button onClick={()=>{localStorage.clear();setToken(null)}}>Logout</button>

        <h3>Create document</h3>
        <input placeholder='Reg number' value={form.registrationNumber} onChange={e=>setForm({...form,registrationNumber:e.target.value})}/>
        <input placeholder='Title' value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/>
        <input placeholder='Description' value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
        <input type='number' value={form.documentTypeId} onChange={e=>setForm({...form,documentTypeId:Number(e.target.value)})}/>
        <button onClick={createDoc}>Save draft</button>

        <h3>Documents</h3>
        <input placeholder='Find by reg' value={filters.registrationNumber} onChange={e=>setFilters({...filters,registrationNumber:e.target.value})}/>
        <input placeholder='Status' value={filters.status} onChange={e=>setFilters({...filters,status:e.target.value})}/>
        <button onClick={load}>Search</button>
        <ul>
            {docs.map(d=><li key={d.id}>{d.registrationNumber} | {d.title} | {d.status}
                <button onClick={()=>openDoc(d.id)}>Audit</button>
                {d.status==='DRAFT' || d.status==='REWORK' ? <button onClick={()=>sendApproval(d.id)}>Send approval</button> : null}
            </li>)}
        </ul>

        {selectedId && <div><h4>Audit #{selectedId}</h4><ul>{audit.map((a,i)=><li key={i}>{a.createdAt} {a.type} {a.details}</li>)}</ul></div>}

        {roles.includes('ROLE_APPROVER') && <div><h3>Approver panel</h3>{docs.map(d=><ApproverDoc key={d.id} doc={d} token={token} approve={approve} />)}</div>}

        <h3>Report summary</h3>
        <pre>{JSON.stringify(report, null, 2)}</pre>

        {roles.includes('ROLE_ADMIN') && <div><h3>Admin / document types</h3><pre>{JSON.stringify(types,null,2)}</pre></div>}
    </div>;
}

function ApproverDoc({ doc, token, approve }) {
    const [steps, setSteps] = useState([]);
    useEffect(() => {
        if (doc.status === 'IN_APPROVAL') fetch(`http://localhost:8080/api/documents/${doc.id}/approval-steps`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json()).then(setSteps).catch(() => {});
    }, [doc.id, doc.status, token]);
    if (doc.status !== 'IN_APPROVAL') return null;
    return <div><b>{doc.registrationNumber}</b>{steps.map(s=><div key={s.id}>{s.order} {s.approver} {s.status}
        {s.status==='PENDING' && <><button onClick={()=>approve(s.id,'APPROVE')}>Approve</button><button onClick={()=>approve(s.id,'REWORK')}>Rework</button><button onClick={()=>approve(s.id,'REJECT')}>Reject</button></>}
    </div>)}</div>;
}
