package io.github.killmeprince.docu.service;

import io.github.killmeprince.docu.dto.request.DocumentCreateRequest;
import io.github.killmeprince.docu.dto.request.DocumentUpdateRequest;
import io.github.killmeprince.docu.dto.response.DocumentDetailsResponse;
import io.github.killmeprince.docu.dto.response.DocumentResponse;
import io.github.killmeprince.docu.dto.response.DocumentVersionResponse;
import io.github.killmeprince.docu.entity.ApprovalStep;
import io.github.killmeprince.docu.entity.Document;
import io.github.killmeprince.docu.entity.DocumentType;
import io.github.killmeprince.docu.entity.DocumentVersion;
import io.github.killmeprince.docu.entity.FileAttachment;
import io.github.killmeprince.docu.entity.User;
import io.github.killmeprince.docu.enums.ApprovalStepStatus;
import io.github.killmeprince.docu.enums.AuditEventType;
import io.github.killmeprince.docu.enums.DocumentStatus;
import io.github.killmeprince.docu.exception.BusinessException;
import io.github.killmeprince.docu.exception.NotFoundException;
import io.github.killmeprince.docu.mapper.DocumentMapper;
import io.github.killmeprince.docu.repository.ApprovalRouteTemplateRepository;
import io.github.killmeprince.docu.repository.ApprovalStepRepository;
import io.github.killmeprince.docu.repository.ApprovalStepTemplateRepository;
import io.github.killmeprince.docu.repository.DocumentRepository;
import io.github.killmeprince.docu.repository.DocumentTypeRepository;
import io.github.killmeprince.docu.repository.DocumentVersionRepository;
import io.github.killmeprince.docu.repository.FileAttachmentRepository;
import io.github.killmeprince.docu.util.DocumentSpecificationBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class DocumentServiceImpl implements DocumentService {
    private final DocumentRepository documentRepository;
    private final DocumentTypeRepository documentTypeRepository;
    private final DocumentVersionRepository versionRepository;
    private final FileAttachmentRepository attachmentRepository;
    private final ApprovalRouteTemplateRepository routeTemplateRepository;
    private final ApprovalStepTemplateRepository stepTemplateRepository;
    private final ApprovalStepRepository approvalStepRepository;
    private final AuditService auditService;
    private final DocumentMapper mapper;
    private final AccessService accessService;
    private final Path storageDir;

    public DocumentServiceImpl(DocumentRepository documentRepository,
                               DocumentTypeRepository documentTypeRepository,
                               DocumentVersionRepository versionRepository,
                               FileAttachmentRepository attachmentRepository,
                               ApprovalRouteTemplateRepository routeTemplateRepository,
                               ApprovalStepTemplateRepository stepTemplateRepository,
                               ApprovalStepRepository approvalStepRepository,
                               AuditService auditService,
                               DocumentMapper mapper,
                               AccessService accessService,
                               @Value("${app.storage.path}") String storagePath) {
        this.documentRepository = documentRepository;
        this.documentTypeRepository = documentTypeRepository;
        this.versionRepository = versionRepository;
        this.attachmentRepository = attachmentRepository;
        this.routeTemplateRepository = routeTemplateRepository;
        this.stepTemplateRepository = stepTemplateRepository;
        this.approvalStepRepository = approvalStepRepository;
        this.auditService = auditService;
        this.mapper = mapper;
        this.accessService = accessService;
        this.storageDir = Path.of(storagePath);
    }

    @Override
    @Transactional
    public DocumentResponse create(DocumentCreateRequest request, MultipartFile file, String username) {
        User author = accessService.getRequiredUser(username);
        if (!accessService.canCreateDocuments(author)) {
            throw new BusinessException("Current role cannot create documents");
        }
        DocumentType type = requireActiveDocumentType(request.documentTypeId());
        validateRegistrationNumberForCreate(request.registrationNumber());

        OffsetDateTime now = OffsetDateTime.now();
        Document document = Document.builder()
                .documentType(type)
                .registrationNumber(request.registrationNumber().trim())
                .registrationDate(now)
                .title(request.title().trim())
                .description(normalizeNullable(request.description()))
                .author(author)
                .status(DocumentStatus.DRAFT)
                .updatedAt(now)
                .build();
        document = documentRepository.save(document);

        createVersion(document, defaultComment(request.changeComment(), "Initial draft"), file, username);
        auditService.log(document.getId(), username, AuditEventType.DOCUMENT_CREATED, "Document created");
        return toSummary(document, author);
    }

    @Override
    @Transactional
    public DocumentResponse update(Long id, DocumentUpdateRequest request, MultipartFile file, String username) {
        User actor = accessService.getRequiredUser(username);
        Document document = getAccessibleDocument(id, actor);
        ensureEditableByAuthor(document, actor);
        DocumentType type = requireActiveDocumentType(request.documentTypeId());
        validateRegistrationNumberForUpdate(document.getRegistrationNumber(), document.getId());

        document.setDocumentType(type);
        document.setTitle(request.title().trim());
        document.setDescription(normalizeNullable(request.description()));
        document.setUpdatedAt(OffsetDateTime.now());
        documentRepository.save(document);

        createVersion(document, defaultComment(request.changeComment(), "Draft updated"), file, username);
        auditService.log(document.getId(), username, AuditEventType.DOCUMENT_EDITED, "Document edited");
        return toSummary(document, actor);
    }

    @Override
    public List<DocumentResponse> search(String regNumber, Long typeId, String author, String status, String username) {
        User actor = accessService.getRequiredUser(username);
        return documentRepository.findAll(DocumentSpecificationBuilder.build(regNumber, typeId, author, status)).stream()
                .filter(document -> accessService.canAccessDocument(actor, document))
                .map(document -> toSummary(document, actor))
                .toList();
    }

    @Override
    public DocumentDetailsResponse getById(Long id, String username) {
        User actor = accessService.getRequiredUser(username);
        Document document = getAccessibleDocument(id, actor);
        List<DocumentVersionResponse> versions = buildVersionResponses(document.getId());
        auditService.log(document.getId(), username, AuditEventType.DOCUMENT_VIEWED, "Document card viewed");
        return mapper.toDetailsResponse(document, versions, isEditable(document, actor));
    }

    @Override
    public List<DocumentVersionResponse> getVersions(Long id, String username) {
        User actor = accessService.getRequiredUser(username);
        Document document = getAccessibleDocument(id, actor);
        return buildVersionResponses(document.getId());
    }

    @Override
    @Transactional
    public void sendToApproval(Long id, String username) {
        User actor = accessService.getRequiredUser(username);
        Document document = getAccessibleDocument(id, actor);
        ensureEditableByAuthor(document, actor);
        if (document.getStatus() != DocumentStatus.DRAFT && document.getStatus() != DocumentStatus.REWORK) {
            throw new BusinessException("Only draft or rework document can be sent to approval");
        }

        var route = routeTemplateRepository.findByDocumentTypeIdAndActiveTrue(document.getDocumentType().getId())
                .orElseThrow(() -> new BusinessException("Approval route is not configured for document type"));
        var templates = stepTemplateRepository.findByRouteTemplateIdOrderByStepOrderAsc(route.getId());
        if (templates.isEmpty()) {
            throw new BusinessException("Approval steps are not configured");
        }

        List<ApprovalStep> existingSteps = approvalStepRepository.findByDocumentIdOrderByStepOrderAsc(id);
        if (!existingSteps.isEmpty()) {
            approvalStepRepository.deleteAll(existingSteps);
            approvalStepRepository.flush();
        }

        for (var template : templates) {
            ApprovalStep step = ApprovalStep.builder()
                    .document(document)
                    .approver(template.getApprover())
                    .stepOrder(template.getStepOrder())
                    .status(ApprovalStepStatus.PENDING)
                    .build();
            approvalStepRepository.save(step);
        }

        document.setStatus(DocumentStatus.IN_APPROVAL);
        document.setUpdatedAt(OffsetDateTime.now());
        documentRepository.save(document);
        auditService.log(document.getId(), username, AuditEventType.DOCUMENT_SENT_FOR_APPROVAL, "Document sent to approval");
        auditService.log(document.getId(), username, AuditEventType.DOCUMENT_STATUS_CHANGED, "Status changed to IN_APPROVAL");
    }

    private DocumentType requireActiveDocumentType(Long documentTypeId) {
        DocumentType type = documentTypeRepository.findById(documentTypeId)
                .orElseThrow(() -> new NotFoundException("Document type not found"));
        if (!type.isActive()) {
            throw new BusinessException("Document type is inactive");
        }
        return type;
    }

    private Document getAccessibleDocument(Long id, User actor) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Document not found"));
        if (!accessService.canAccessDocument(actor, document)) {
            throw new BusinessException("Document is not accessible for current user");
        }
        return document;
    }

    private void ensureEditableByAuthor(Document document, User actor) {
        if (!document.getAuthor().getId().equals(actor.getId())) {
            throw new BusinessException("Only author can modify the document in editable statuses");
        }
        if (!isEditable(document, actor)) {
            throw new BusinessException("Document is not editable in current status");
        }
    }

    private boolean isEditable(Document document, User actor) {
        return document.getAuthor().getId().equals(actor.getId())
                && (document.getStatus() == DocumentStatus.DRAFT || document.getStatus() == DocumentStatus.REWORK);
    }

    private void validateRegistrationNumberForCreate(String registrationNumber) {
        String normalized = registrationNumber == null ? null : registrationNumber.trim();
        if (documentRepository.existsByRegistrationNumberIgnoreCase(normalized)) {
            throw new BusinessException("Document with this registration number already exists");
        }
    }

    private void validateRegistrationNumberForUpdate(String registrationNumber, Long documentId) {
        String normalized = registrationNumber == null ? null : registrationNumber.trim();
        if (documentRepository.existsByRegistrationNumberIgnoreCaseAndIdNot(normalized, documentId)) {
            throw new BusinessException("Document with this registration number already exists");
        }
    }

    private List<DocumentVersionResponse> buildVersionResponses(Long documentId) {
        return versionRepository.findByDocumentIdOrderByVersionNumberDesc(documentId).stream()
                .map(version -> mapper.toVersionResponse(version, attachmentRepository.findByVersionIdOrderByIdAsc(version.getId())))
                .toList();
    }

    private DocumentResponse toSummary(Document document, User actor) {
        DocumentVersion latestVersion = versionRepository.findTopByDocumentIdOrderByVersionNumberDesc(document.getId()).orElse(null);
        FileAttachment latestAttachment = latestVersion == null
                ? null
                : attachmentRepository.findByVersionIdOrderByIdAsc(latestVersion.getId()).stream().reduce((first, second) -> second).orElse(null);
        return mapper.toSummaryResponse(document, latestVersion, latestAttachment, isEditable(document, actor));
    }

    private void createVersion(Document document, String comment, MultipartFile file, String username) {
        Integer current = versionRepository.findTopByDocumentIdOrderByVersionNumberDesc(document.getId())
                .map(DocumentVersion::getVersionNumber)
                .orElse(0);
        DocumentVersion version = versionRepository.save(DocumentVersion.builder()
                .document(document)
                .versionNumber(current + 1)
                .changeComment(comment)
                .createdAt(OffsetDateTime.now())
                .build());

        if (file != null && !file.isEmpty()) {
            storeFile(version, file);
        }
        auditService.log(document.getId(), username, AuditEventType.VERSION_CREATED, "Version " + version.getVersionNumber() + " created");
    }

    private void storeFile(DocumentVersion version, MultipartFile file) {
        try {
            Files.createDirectories(storageDir);
            String safeOriginalName = Path.of(file.getOriginalFilename() == null ? "document.bin" : file.getOriginalFilename()).getFileName().toString();
            String fileName = UUID.randomUUID() + "_" + safeOriginalName;
            Path target = storageDir.resolve(fileName).normalize();
            if (!target.startsWith(storageDir)) {
                throw new BusinessException("Invalid file path");
            }
            file.transferTo(target);
            attachmentRepository.save(FileAttachment.builder()
                    .version(version)
                    .originalName(safeOriginalName)
                    .storagePath(fileName)
                    .sizeBytes(file.getSize())
                    .build());
        } catch (IOException ex) {
            throw new BusinessException("Cannot store file");
        }
    }

    private String defaultComment(String comment, String defaultValue) {
        String normalized = normalizeNullable(comment);
        return normalized == null ? defaultValue : normalized;
    }

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
