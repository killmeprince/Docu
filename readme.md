# Docu — веб-система автоматизации документооборота малой организации

- Frontend: http://localhost:5173
- Backend API: http://localhost:8080/api

## Demo users
Пароль для всех: `password123`
- `employee` — EMPLOYEE
- `approver` — APPROVER
- `admin` — ADMIN

## Поддержанные сценарии MVP
1. Вход в систему.
2. Создание документа и сохранение в черновик.
3. Редактирование документа в статусе Draft/Rework.
4. Загрузка файла при создании/редактировании версии.
5. Отправка документа на согласование.
6. Решение согласующего: APPROVE / REWORK / REJECT.
7. Раздельные статусы документа и шага согласования.
8. Поиск/фильтрация документов по reg number, type, author, status.
9. Аудит событий по документу.
10. Простая отчетность.
11. Admin: просмотр пользователей и типов документов, создание типа.

## Что реализовано
- Технически-слоистая структура backend (`config/ controller/ dto/ entity/ repository/ service/ security/ exception/ mapper/ util/ enums/`).
- Миграции Flyway и seed data.
- Ролевой доступ (EMPLOYEE/APPROVER/ADMIN).
- Сущности: User, Role, DocumentType, Document, DocumentVersion, FileAttachment, ApprovalRouteTemplate, ApprovalStepTemplate, ApprovalStep, AuditEvent.

## Что не реализовано
- ЭП, интеграции с внешними ЭДО/гос. системами.
- Сложный конструктор маршрутов согласования.
- Полноценное управление правами (fine-grained permissions).
- SLA/эскалации и автоматическая просрочка шагов.
- Расширенные отчеты, экспорт и BI.
- Production-grade hardening (refresh token, rate limit, audit immutability, antivirus scan файлов).

## REST endpoints 
- `POST /api/auth/login`
- `POST /api/documents` (multipart: payload + optional file)
- `PUT /api/documents/{id}`
- `GET /api/documents`
- `GET /api/documents/{id}`
- `POST /api/documents/{id}/send-to-approval`
- `GET /api/documents/{id}/approval-steps`
- `POST /api/approvals/steps/{id}/decision`
- `GET /api/audit/documents/{documentId}`
- `GET /api/reports/summary`
- `GET /api/admin/users`
- `GET /api/admin/document-types`
- `POST /api/admin/document-types`

## Сущности 
- User, Role, DocumentType, Document, DocumentVersion, FileAttachment,
  ApprovalRouteTemplate, ApprovalStepTemplate, ApprovalStep, AuditEvent.

## Ограничения MVP
- 1 активный шаблон маршрута на тип документа.

