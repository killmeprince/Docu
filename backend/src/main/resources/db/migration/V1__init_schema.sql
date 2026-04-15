create table roles (
    id bigserial primary key,
    name varchar(50) not null unique
);

create table users (
    id bigserial primary key,
    username varchar(100) not null unique,
    password_hash varchar(255) not null,
    full_name varchar(255) not null,
    active boolean not null default true
);

create table user_roles (
    user_id bigint not null references users(id) on delete cascade,
    role_id bigint not null references roles(id) on delete cascade,
    primary key (user_id, role_id)
);

create table document_types (
    id bigserial primary key,
    code varchar(100) not null unique,
    name varchar(255) not null,
    active boolean not null default true
);

create table documents (
    id bigserial primary key,
    document_type_id bigint not null references document_types(id),
    registration_number varchar(100) not null unique,
    registration_date timestamp with time zone not null,
    title varchar(255) not null,
    description text,
    author_id bigint not null references users(id),
    status varchar(50) not null,
    updated_at timestamp with time zone not null
);
create index idx_documents_type on documents(document_type_id);
create index idx_documents_author on documents(author_id);
create index idx_documents_status on documents(status);
create index idx_documents_registration_date on documents(registration_date);

create table document_versions (
    id bigserial primary key,
    document_id bigint not null references documents(id) on delete cascade,
    version_number integer not null,
    change_comment varchar(500) not null,
    created_at timestamp with time zone not null,
    unique (document_id, version_number)
);
create index idx_document_versions_document on document_versions(document_id);

create table file_attachments (
    id bigserial primary key,
    version_id bigint not null references document_versions(id) on delete cascade,
    original_name varchar(255) not null,
    storage_path varchar(255) not null unique,
    size_bytes bigint not null
);
create index idx_file_attachments_version on file_attachments(version_id);

create table approval_route_templates (
    id bigserial primary key,
    document_type_id bigint not null references document_types(id),
    name varchar(255) not null,
    active boolean not null default true
);
create index idx_approval_route_templates_document_type on approval_route_templates(document_type_id);

create table approval_step_templates (
    id bigserial primary key,
    route_template_id bigint not null references approval_route_templates(id) on delete cascade,
    approver_id bigint not null references users(id),
    step_order integer not null,
    unique (route_template_id, step_order)
);
create index idx_approval_step_templates_route on approval_step_templates(route_template_id);

create table approval_steps (
    id bigserial primary key,
    document_id bigint not null references documents(id) on delete cascade,
    approver_id bigint not null references users(id),
    step_order integer not null,
    status varchar(50) not null,
    comment text,
    decided_at timestamp with time zone,
    unique (document_id, step_order)
);
create index idx_approval_steps_document on approval_steps(document_id);
create index idx_approval_steps_approver on approval_steps(approver_id);
create index idx_approval_steps_status on approval_steps(status);

create table audit_events (
    id bigserial primary key,
    document_id bigint references documents(id) on delete set null,
    actor_id bigint not null references users(id),
    type varchar(100) not null,
    details text not null,
    created_at timestamp with time zone not null
);
create index idx_audit_events_document on audit_events(document_id);
create index idx_audit_events_created_at on audit_events(created_at);
