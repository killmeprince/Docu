package io.github.killmeprince.docu.service;

import io.github.killmeprince.docu.dto.response.AuditEventResponse;
import io.github.killmeprince.docu.entity.AuditEvent;
import io.github.killmeprince.docu.entity.Document;
import io.github.killmeprince.docu.entity.User;
import io.github.killmeprince.docu.enums.AuditEventType;
import io.github.killmeprince.docu.exception.BusinessException;
import io.github.killmeprince.docu.exception.NotFoundException;
import io.github.killmeprince.docu.mapper.AuditMapper;
import io.github.killmeprince.docu.repository.AuditEventRepository;
import io.github.killmeprince.docu.repository.DocumentRepository;
import io.github.killmeprince.docu.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;

@Service
public class AuditServiceImpl implements AuditService {
    private final AuditEventRepository auditEventRepository;
    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final AuditMapper auditMapper;
    private final AccessService accessService;

    public AuditServiceImpl(AuditEventRepository auditEventRepository,
                            DocumentRepository documentRepository,
                            UserRepository userRepository,
                            AuditMapper auditMapper,
                            AccessService accessService) {
        this.auditEventRepository = auditEventRepository;
        this.documentRepository = documentRepository;
        this.userRepository = userRepository;
        this.auditMapper = auditMapper;
        this.accessService = accessService;
    }

    @Override
    public void log(Long documentId, String username, AuditEventType type, String details) {
        Document document = documentId == null ? null : documentRepository.findById(documentId).orElse(null);
        User user = userRepository.findByUsername(username).orElseThrow(() -> new NotFoundException("User not found"));
        AuditEvent event = AuditEvent.builder()
                .document(document)
                .actor(user)
                .type(type)
                .details(details)
                .createdAt(OffsetDateTime.now())
                .build();
        auditEventRepository.save(event);
    }

    @Override
    public List<AuditEventResponse> getDocumentAudit(Long documentId, String username) {
        User actor = accessService.getRequiredUser(username);
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new NotFoundException("Document not found"));
        if (!accessService.canAccessDocument(actor, document)) {
            throw new BusinessException("Document is not accessible for current user");
        }
        return auditEventRepository.findByDocumentIdOrderByCreatedAtDesc(documentId).stream()
                .map(auditMapper::toResponse)
                .toList();
    }
}
