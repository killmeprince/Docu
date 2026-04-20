delete from approval_step_templates ast
    using users u
where ast.approver_id = u.id
  and u.username in ('employee', 'approver', 'admin');

delete from user_roles ur
    using users u
where ur.user_id = u.id
  and u.username in ('employee', 'approver', 'admin');

delete from users
where username in ('employee', 'approver', 'admin');

insert into users(username, password_hash, full_name, active) values
                                                                  ('автор_документов', '$2y$10$cZfzf2QBFc4cKLtZSV0JdeKh6/.E3YDFq82d4olD/eKvB0ZH9egnO', 'Иван Петров', true),
                                                                  ('руководитель_отдела', '$2y$10$cZfzf2QBFc4cKLtZSV0JdeKh6/.E3YDFq82d4olD/eKvB0ZH9egnO', 'Ольга Смирнова', true),
                                                                  ('юрист', '$2y$10$cZfzf2QBFc4cKLtZSV0JdeKh6/.E3YDFq82d4olD/eKvB0ZH9egnO', 'Антон Кузнецов', true),
                                                                  ('финансовый_контроль', '$2y$10$cZfzf2QBFc4cKLtZSV0JdeKh6/.E3YDFq82d4olD/eKvB0ZH9egnO', 'Мария Власова', true),
                                                                  ('служба_безопасности', '$2y$10$cZfzf2QBFc4cKLtZSV0JdeKh6/.E3YDFq82d4olD/eKvB0ZH9egnO', 'Дмитрий Орлов', true),
                                                                  ('администратор_системы', '$2y$10$cZfzf2QBFc4cKLtZSV0JdeKh6/.E3YDFq82d4olD/eKvB0ZH9egnO', 'Елена Соколова', true);

insert into user_roles(user_id, role_id)
select u.id,
       case
           when u.username = 'автор_документов' then r_employee.id
           when u.username in ('руководитель_отдела', 'юрист', 'финансовый_контроль', 'служба_безопасности') then r_approver.id
           when u.username = 'администратор_системы' then r_admin.id
           end
from users u
         cross join roles r_employee
         cross join roles r_approver
         cross join roles r_admin
where r_employee.name = 'ROLE_EMPLOYEE'
  and r_approver.name = 'ROLE_APPROVER'
  and r_admin.name = 'ROLE_ADMIN'
  and u.username in (
                     'автор_документов',
                     'руководитель_отдела',
                     'юрист',
                     'финансовый_контроль',
                     'служба_безопасности',
                     'администратор_системы'
    );

update approval_route_templates
set name = replace(name, 'базовый маршрут', 'расширенный маршрут согласования')
where name like '%базовый маршрут%';

delete from approval_step_templates;

insert into approval_step_templates(route_template_id, approver_id, step_order)
select rt.id, u.id, steps.step_order
from approval_route_templates rt
         join (
    values
        ('руководитель_отдела', 1),
        ('юрист', 2),
        ('финансовый_контроль', 3),
        ('служба_безопасности', 4)
) as steps(username, step_order) on true
         join users u on u.username = steps.username;
