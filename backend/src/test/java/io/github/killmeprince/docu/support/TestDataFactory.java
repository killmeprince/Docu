package io.github.killmeprince.docu.support;

import io.github.killmeprince.docu.dto.response.*;
import io.github.killmeprince.docu.entity.*;
import io.github.killmeprince.docu.enums.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;

public final class TestDataFactory {
    private TestDataFactory() {
    }

    public static Role role(String name) {
        return Role.builder().id(1L).name(name).build();
    }

    public static User user(Long id, String username, String fullName, String... roles) {
        return User.builder()
                .id(id)
                .username(username)
                .passwordHash("hash")
                .fullName(fullName)
                .active(true)
                .roles(Set.of(roles).stream().map(TestDataFactory::role).collect(java.util.stream.Collectors.toSet()))
                .build();
    }

    public static DocumentType documentType(Long id, String code, String name, boolean active) {
        return DocumentType.builder().id(id).code(code).name(name).active(active).build();
    }

    public static Document document(Long id, DocumentType type, User author, DocumentStatus status) {
        return Document.builder()
                .id(id)
                .documentType(type)
                .registrationNumber("REG-001")
                .registrationDate(OffsetDateTime.parse("2026-04-15T10:00:00Z"))
                .title("Document title")
                .description("Description")
                .author(author)
                .status(status)
                .updatedAt(OffsetDateTime.parse("2026-04-15T10:10:00Z"))
                .build();
    }

    public static DocumentVersion version(Long id, Document document, int versionNumber, String comment) {
        return DocumentVersion.builder()
                .id(id)
                .document(document)
                .versionNumber(versionNumber)
                .changeComment(comment)
                .createdAt(OffsetDateTime.parse("2026-04-15T10:20:00Z"))
                .build();
    }

    public static FileAttachment attachment(Long id, DocumentVersion version, String name, String storagePath) {
        return FileAttachment.builder()
                .id(id)
                .version(version)
                .originalName(name)
                .storagePath(storagePath)
                .sizeBytes(128L)
                .build();
    }

    public static ApprovalStep approvalStep(Long id, Document document, User approver, int order, ApprovalStepStatus status) {
        return ApprovalStep.builder()
                .id(id)
                .document(document)
                .approver(approver)
                .stepOrder(order)
                .status(status)
                .comment(null)
                .build();
    }

    public static ApprovalRouteTemplate routeTemplate(Long id, DocumentType documentType) {
        return ApprovalRouteTemplate.builder().id(id).documentType(documentType).name("Default route").active(true).build();
    }

    public static ApprovalStepTemplate stepTemplate(Long id, ApprovalRouteTemplate route, User approver, int order) {
        return ApprovalStepTemplate.builder().id(id).routeTemplate(route).approver(approver).stepOrder(order).build();
    }

    public static AuditEvent auditEvent(Long id, Document document, User actor, AuditEventType type, String details) {
        return AuditEvent.builder()
                .id(id)
                .document(document)
                .actor(actor)
                .type(type)
                .details(details)
                .createdAt(OffsetDateTime.parse("2026-04-15T11:00:00Z"))
                .build();
    }

    public static DocumentResponse documentResponse(Long id) {
        return new DocumentResponse(id, 1L, "ORDER", "Order", "REG-001", OffsetDateTime.parse("2026-04-15T10:00:00Z"),
                "Document title", "Description", "employee", "Employee User", "DRAFT",
                OffsetDateTime.parse("2026-04-15T10:10:00Z"), 1, "doc.pdf", "/api/files/doc.pdf", true);
    }

    public static DocumentVersionResponse documentVersionResponse(Long id) {
        return new DocumentVersionResponse(id, 1, "Initial draft", OffsetDateTime.parse("2026-04-15T10:20:00Z"),
                List.of(new FileAttachmentResponse(1L, "doc.pdf", 128L, "/api/files/doc.pdf")));
    }

    public static DocumentDetailsResponse documentDetailsResponse(Long id) {
        return new DocumentDetailsResponse(id, 1L, "ORDER", "Order", "REG-001", OffsetDateTime.parse("2026-04-15T10:00:00Z"),
                "Document title", "Description", "employee", "Employee User", "DRAFT",
                OffsetDateTime.parse("2026-04-15T10:10:00Z"), true, List.of(documentVersionResponse(10L)));
    }

    public static ApprovalStepResponse approvalStepResponse(Long id) {
        return new ApprovalStepResponse(id, 1, "Approver User", "PENDING", null, null);
    }

    public static AuditEventResponse auditEventResponse() {
        return new AuditEventResponse("Employee User", "DOCUMENT_CREATED", "Document created", OffsetDateTime.parse("2026-04-15T11:00:00Z"));
    }

    public static ReportResponse reportResponse() {
        return new ReportResponse(3L, java.util.Map.of("DRAFT", 1L), java.util.Map.of("Order", 3L), 1L, 1L, 1L, 0L, 2L);
    }

    public static UserResponse userResponse(Long id) {
        return new UserResponse(id, "employee", "Employee User", true, Set.of("ROLE_EMPLOYEE"));
    }

    public static DocumentTypeResponse documentTypeResponse(Long id) {
        return new DocumentTypeResponse(id, "ORDER", "Order", true);
    }
}
