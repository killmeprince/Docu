insert into roles(name) values
    ('ROLE_EMPLOYEE'),
    ('ROLE_APPROVER'),
    ('ROLE_ADMIN');

insert into users(username, password_hash, full_name, active) values
    ('employee', '$2y$10$cZfzf2QBFc4cKLtZSV0JdeKh6/.E3YDFq82d4olD/eKvB0ZH9egnO', 'Employee Demo', true),
    ('approver', '$2y$10$cZfzf2QBFc4cKLtZSV0JdeKh6/.E3YDFq82d4olD/eKvB0ZH9egnO', 'Approver Demo', true),
    ('admin', '$2y$10$cZfzf2QBFc4cKLtZSV0JdeKh6/.E3YDFq82d4olD/eKvB0ZH9egnO', 'Administrator Demo', true);

insert into user_roles(user_id, role_id)
select u.id, r.id
from users u
join roles r on (
    (u.username = 'employee' and r.name = 'ROLE_EMPLOYEE') or
    (u.username = 'approver' and r.name = 'ROLE_APPROVER') or
    (u.username = 'admin' and r.name = 'ROLE_ADMIN')
);

insert into document_types(code, name, active) values
    ('MEMO', 'Служебная записка', true),
    ('ORDER', 'Приказ', true),
    ('CONTRACT', 'Договор', true);

insert into approval_route_templates(document_type_id, name, active)
select id, name || ' — базовый маршрут', true
from document_types
where code in ('MEMO', 'ORDER', 'CONTRACT');

insert into approval_step_templates(route_template_id, approver_id, step_order)
select rt.id, u.id, 1
from approval_route_templates rt
join users u on u.username = 'approver';
