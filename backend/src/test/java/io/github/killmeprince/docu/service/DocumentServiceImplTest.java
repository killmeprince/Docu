package io.github.killmeprince.docu.service;

import io.github.killmeprince.docu.dto.request.DocumentCreateRequest;
import io.github.killmeprince.docu.dto.request.DocumentUpdateRequest;
import io.github.killmeprince.docu.dto.response.DocumentDetailsResponse;
import io.github.killmeprince.docu.dto.response.DocumentResponse;
import io.github.killmeprince.docu.dto.response.DocumentVersionResponse;
import io.github.killmeprince.docu.entity.*;
import io.github.killmeprince.docu.enums.ApprovalStepStatus;
import io.github.killmeprince.docu.enums.AuditEventType;
import io.github.killmeprince.docu.enums.DocumentStatus;
import io.github.killmeprince.docu.exception.BusinessException;
import io.github.killmeprince.docu.mapper.DocumentMapper;
import io.github.killmeprince.docu.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;

import static io.github.killmeprince.docu.support.TestDataFactory.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DocumentServiceImplTest {

    @Mock private DocumentRepository documentRepository;
    @Mock private DocumentTypeRepository documentTypeRepository;
    @Mock private DocumentVersionRepository versionRepository;
    @Mock private FileAttachmentRepository attachmentRepository;
    @Mock private ApprovalRouteTemplateRepository routeTemplateRepository;
    @Mock private ApprovalStepTemplateRepository stepTemplateRepository;
    @Mock private ApprovalStepRepository approvalStepRepository;
    @Mock private AuditService auditService;
    @Mock private DocumentMapper mapper;
    @Mock private AccessService accessService;

    @TempDir Path tempDir;

    private DocumentServiceImpl documentService;
    private User author;
    private User approver;
    private DocumentType type;

    @BeforeEach
    void setUp() {
        documentService = new DocumentServiceImpl(documentRepository, documentTypeRepository, versionRepository, attachmentRepository,
                routeTemplateRepository, stepTemplateRepository, approvalStepRepository, auditService, mapper, accessService,
                tempDir.toString());
        author = user(2L, "employee", "Employee User", "ROLE_EMPLOYEE");
        approver = user(3L, "approver", "Approver User", "ROLE_APPROVER");
        type = documentType(1L, "ORDER", "Order", true);
    }

    @Test
    void create_createsDocumentVersionAndFile() throws Exception {
        DocumentCreateRequest request = new DocumentCreateRequest(1L, " REG-001 ", " Title ", " Description ", null);
        MockMultipartFile file = new MockMultipartFile("file", "doc.txt", "text/plain", "content".getBytes());
        when(accessService.getRequiredUser("employee")).thenReturn(author);
        when(accessService.canCreateDocuments(author)).thenReturn(true);
        when(documentTypeRepository.findById(1L)).thenReturn(Optional.of(type));
        when(documentRepository.existsByRegistrationNumberIgnoreCase("REG-001")).thenReturn(false);
        when(documentRepository.save(any(Document.class))).thenAnswer(invocation -> {
            Document document = invocation.getArgument(0);
            if (document.getId() == null) {
                document.setId(10L);
            }
            return document;
        });
        when(versionRepository.findTopByDocumentIdOrderByVersionNumberDesc(10L))
                .thenReturn(Optional.empty(), Optional.of(version(100L, document(10L, type, author, DocumentStatus.DRAFT), 1, "Initial draft")));
        when(versionRepository.save(any(DocumentVersion.class))).thenAnswer(invocation -> {
            DocumentVersion version = invocation.getArgument(0);
            version.setId(100L);
            return version;
        });
        when(attachmentRepository.save(any(FileAttachment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(attachmentRepository.findByVersionIdOrderByIdAsc(100L)).thenReturn(List.of(attachment(1L, version(100L, document(10L, type, author, DocumentStatus.DRAFT), 1, "Initial draft"), "doc.txt", "stored.txt")));
        when(mapper.toSummaryResponse(any(Document.class), any(DocumentVersion.class), any(FileAttachment.class), eq(true))).thenReturn(documentResponse(10L));

        DocumentResponse result = documentService.create(request, file, "employee");

        assertEquals(10L, result.id());
        verify(auditService).log(10L, "employee", AuditEventType.VERSION_CREATED, "Version 1 created");
        verify(auditService).log(10L, "employee", AuditEventType.DOCUMENT_CREATED, "Document created");
        assertTrue(Files.list(tempDir).findAny().isPresent());
    }

    @Test
    void create_rejectsInactiveDocumentType() {
        when(accessService.getRequiredUser("employee")).thenReturn(author);
        when(accessService.canCreateDocuments(author)).thenReturn(true);
        when(documentTypeRepository.findById(1L)).thenReturn(Optional.of(documentType(1L, "ORDER", "Order", false)));

        assertThrows(BusinessException.class,
                () -> documentService.create(new DocumentCreateRequest(1L, "REG-001", "Title", null, null), null, "employee"));
    }

    @Test
    void update_updatesEditableDraftAndCreatesNewVersion() {
        Document existing = document(10L, type, author, DocumentStatus.DRAFT);
        DocumentUpdateRequest request = new DocumentUpdateRequest(1L, "Updated title", " Updated description ", "Refined");
        when(accessService.getRequiredUser("employee")).thenReturn(author);
        when(documentRepository.findById(10L)).thenReturn(Optional.of(existing));
        when(accessService.canAccessDocument(author, existing)).thenReturn(true);
        when(documentTypeRepository.findById(1L)).thenReturn(Optional.of(type));
        when(documentRepository.existsByRegistrationNumberIgnoreCaseAndIdNot("REG-001", 10L)).thenReturn(false);
        when(documentRepository.save(existing)).thenReturn(existing);
        when(versionRepository.findTopByDocumentIdOrderByVersionNumberDesc(10L))
                .thenReturn(Optional.of(version(11L, existing, 1, "Initial draft")), Optional.of(version(12L, existing, 2, "Refined")));
        when(versionRepository.save(any(DocumentVersion.class))).thenAnswer(invocation -> {
            DocumentVersion version = invocation.getArgument(0);
            version.setId(12L);
            return version;
        });
        when(attachmentRepository.findByVersionIdOrderByIdAsc(12L)).thenReturn(List.of());
        when(mapper.toSummaryResponse(eq(existing), any(DocumentVersion.class), isNull(), eq(true))).thenReturn(documentResponse(10L));

        DocumentResponse result = documentService.update(10L, request, null, "employee");

        assertEquals("Updated title", existing.getTitle());
        assertEquals("Updated description", existing.getDescription());
        assertEquals(10L, result.id());
        verify(auditService).log(10L, "employee", AuditEventType.DOCUMENT_EDITED, "Document edited");
    }

    @Test
    void update_rejectsWhenDocumentNotEditable() {
        Document existing = document(10L, type, author, DocumentStatus.IN_APPROVAL);
        when(accessService.getRequiredUser("employee")).thenReturn(author);
        when(documentRepository.findById(10L)).thenReturn(Optional.of(existing));
        when(accessService.canAccessDocument(author, existing)).thenReturn(true);

        assertThrows(BusinessException.class,
                () -> documentService.update(10L, new DocumentUpdateRequest(1L, "Updated", null, null), null, "employee"));
    }

    @Test
    void search_filtersByAccessibleDocumentsOnly() {
        Document own = document(10L, type, author, DocumentStatus.DRAFT);
        Document other = document(11L, type, approver, DocumentStatus.DRAFT);
        when(accessService.getRequiredUser("employee")).thenReturn(author);
        when(documentRepository.findAll(any(org.springframework.data.jpa.domain.Specification.class))).thenReturn(List.of(own, other));
        when(accessService.canAccessDocument(author, own)).thenReturn(true);
        when(accessService.canAccessDocument(author, other)).thenReturn(false);
        when(versionRepository.findTopByDocumentIdOrderByVersionNumberDesc(10L)).thenReturn(Optional.empty());
        when(mapper.toSummaryResponse(eq(own), isNull(), isNull(), eq(true))).thenReturn(documentResponse(10L));

        List<DocumentResponse> result = documentService.search("REG", null, null, null, "employee");

        assertEquals(1, result.size());
        assertEquals(10L, result.get(0).id());
    }

    @Test
    void getById_returnsDetailsAndLogsView() {
        Document existing = document(10L, type, author, DocumentStatus.DRAFT);
        DocumentVersion savedVersion = version(20L, existing, 1, "Initial draft");
        when(accessService.getRequiredUser("employee")).thenReturn(author);
        when(documentRepository.findById(10L)).thenReturn(Optional.of(existing));
        when(accessService.canAccessDocument(author, existing)).thenReturn(true);
        when(versionRepository.findByDocumentIdOrderByVersionNumberDesc(10L)).thenReturn(List.of(savedVersion));
        when(attachmentRepository.findByVersionIdOrderByIdAsc(20L)).thenReturn(List.of());
        when(mapper.toVersionResponse(savedVersion, List.of())).thenReturn(documentVersionResponse(20L));
        when(mapper.toDetailsResponse(eq(existing), anyList(), eq(true))).thenReturn(documentDetailsResponse(10L));

        DocumentDetailsResponse result = documentService.getById(10L, "employee");

        assertEquals(10L, result.id());
        verify(auditService).log(10L, "employee", AuditEventType.DOCUMENT_VIEWED, "Document card viewed");
    }

    @Test
    void getVersions_returnsMappedVersions() {
        Document existing = document(10L, type, author, DocumentStatus.DRAFT);
        DocumentVersion savedVersion = version(20L, existing, 1, "Initial draft");
        when(accessService.getRequiredUser("employee")).thenReturn(author);
        when(documentRepository.findById(10L)).thenReturn(Optional.of(existing));
        when(accessService.canAccessDocument(author, existing)).thenReturn(true);
        when(versionRepository.findByDocumentIdOrderByVersionNumberDesc(10L)).thenReturn(List.of(savedVersion));
        when(attachmentRepository.findByVersionIdOrderByIdAsc(20L)).thenReturn(List.of());
        when(mapper.toVersionResponse(savedVersion, List.of())).thenReturn(documentVersionResponse(20L));

        List<DocumentVersionResponse> result = documentService.getVersions(10L, "employee");

        assertEquals(1, result.size());
        assertEquals(20L, result.get(0).id());
    }

    @Test
    void sendToApproval_createsPendingStepsAndChangesStatus() {
        Document existing = document(10L, type, author, DocumentStatus.DRAFT);
        ApprovalRouteTemplate route = routeTemplate(1L, type);
        ApprovalStepTemplate template1 = stepTemplate(1L, route, approver, 1);
        when(accessService.getRequiredUser("employee")).thenReturn(author);
        when(documentRepository.findById(10L)).thenReturn(Optional.of(existing));
        when(accessService.canAccessDocument(author, existing)).thenReturn(true);
        when(routeTemplateRepository.findByDocumentTypeIdAndActiveTrue(1L)).thenReturn(Optional.of(route));
        when(stepTemplateRepository.findByRouteTemplateIdOrderByStepOrderAsc(1L)).thenReturn(List.of(template1));
        when(approvalStepRepository.findByDocumentIdOrderByStepOrderAsc(10L)).thenReturn(List.of());

        documentService.sendToApproval(10L, "employee");

        assertEquals(DocumentStatus.IN_APPROVAL, existing.getStatus());
        verify(approvalStepRepository).save(any(ApprovalStep.class));
        verify(auditService).log(10L, "employee", AuditEventType.DOCUMENT_SENT_FOR_APPROVAL, "Document sent to approval");
        verify(auditService).log(10L, "employee", AuditEventType.DOCUMENT_STATUS_CHANGED, "Status changed to IN_APPROVAL");
    }

    @Test
    void sendToApproval_rejectsWhenNoRouteConfigured() {
        Document existing = document(10L, type, author, DocumentStatus.DRAFT);
        when(accessService.getRequiredUser("employee")).thenReturn(author);
        when(documentRepository.findById(10L)).thenReturn(Optional.of(existing));
        when(accessService.canAccessDocument(author, existing)).thenReturn(true);
        when(routeTemplateRepository.findByDocumentTypeIdAndActiveTrue(1L)).thenReturn(Optional.empty());

        assertThrows(BusinessException.class, () -> documentService.sendToApproval(10L, "employee"));
    }
}
