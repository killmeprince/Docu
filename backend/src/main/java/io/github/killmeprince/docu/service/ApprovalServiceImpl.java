package io.github.killmeprince.docu.service;

import io.github.killmeprince.docu.dto.request.ApprovalDecisionRequest;
import io.github.killmeprince.docu.dto.response.ApprovalStepResponse;
import io.github.killmeprince.docu.entity.ApprovalStep;
import io.github.killmeprince.docu.entity.Document;
import io.github.killmeprince.docu.entity.User;
import io.github.killmeprince.docu.enums.ApprovalDecision;
import io.github.killmeprince.docu.enums.ApprovalStepStatus;
import io.github.killmeprince.docu.enums.AuditEventType;
import io.github.killmeprince.docu.enums.DocumentStatus;
import io.github.killmeprince.docu.exception.BusinessException;
import io.github.killmeprince.docu.exception.NotFoundException;
import io.github.killmeprince.docu.mapper.ApprovalMapper;
import io.github.killmeprince.docu.repository.ApprovalStepRepository;
import io.github.killmeprince.docu.repository.DocumentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Service
public class ApprovalServiceImpl implements ApprovalService {
    private final ApprovalStepRepository stepRepository;
    private final DocumentRepository documentRepository;
    private final AuditService auditService;
    private final ApprovalMapper mapper;
    private final AccessService accessService;

    public ApprovalServiceImpl(ApprovalStepRepository stepRepository,
                               DocumentRepository documentRepository,
                               AuditService auditService,
                               ApprovalMapper mapper,
                               AccessService accessService) {
        this.stepRepository = stepRepository;
        this.documentRepository = documentRepository;
        this.auditService = auditService;
        this.mapper = mapper;
        this.accessService = accessService;
    }

    @Override
    @Transactional
    public void decide(Long stepId, ApprovalDecisionRequest request, String username) {
        User actor = accessService.getRequiredUser(username);
        ApprovalStep step = stepRepository.findByIdAndApproverUsername(stepId, username)
                .orElseThrow(() -> new NotFoundException("Approval step not found"));
        Document document = step.getDocument();
        if (!accessService.canAccessDocument(actor, document)) {
            throw new BusinessException("Document is not accessible for current user");
        }
        if (document.getStatus() != DocumentStatus.IN_APPROVAL) {
            throw new BusinessException("Document is not in approval state");
        }
        if (step.getStatus() != ApprovalStepStatus.PENDING) {
            throw new BusinessException("Step already decided");
        }

        ApprovalStep currentStep = currentPendingStep(document.getId());
        if (!currentStep.getId().equals(step.getId())) {
            throw new BusinessException("Only current approval step can be processed");
        }

        switch (request.decision()) {
            case APPROVE -> step.setStatus(ApprovalStepStatus.APPROVED);
            case REWORK -> step.setStatus(ApprovalStepStatus.REWORK);
            case REJECT -> step.setStatus(ApprovalStepStatus.REJECTED);
        }
        step.setComment(normalizeNullable(request.comment()));
        step.setDecidedAt(OffsetDateTime.now());
        stepRepository.save(step);

        if (request.decision() == ApprovalDecision.REWORK) {
            document.setStatus(DocumentStatus.REWORK);
        } else if (request.decision() == ApprovalDecision.REJECT) {
            document.setStatus(DocumentStatus.REJECTED);
        } else if (allStepsApproved(document.getId())) {
            document.setStatus(DocumentStatus.APPROVED);
        } else {
            document.setStatus(DocumentStatus.IN_APPROVAL);
        }
        document.setUpdatedAt(OffsetDateTime.now());
        documentRepository.save(document);

        String details = "Decision: " + request.decision() + (step.getComment() == null ? "" : ". " + step.getComment());
        auditService.log(document.getId(), username, AuditEventType.APPROVAL_DECISION, details);
        auditService.log(document.getId(), username, AuditEventType.DOCUMENT_STATUS_CHANGED, "Status changed to " + document.getStatus());
    }

    @Override
    public List<ApprovalStepResponse> byDocument(Long documentId, String username) {
        User actor = accessService.getRequiredUser(username);
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new NotFoundException("Document not found"));
        if (!accessService.canAccessDocument(actor, document)) {
            throw new BusinessException("Document is not accessible for current user");
        }
        return stepRepository.findByDocumentIdOrderByStepOrderAsc(documentId).stream().map(mapper::toResponse).toList();
    }

    private ApprovalStep currentPendingStep(Long documentId) {
        return stepRepository.findByDocumentIdOrderByStepOrderAsc(documentId).stream()
                .filter(step -> step.getStatus() == ApprovalStepStatus.PENDING)
                .findFirst()
                .orElseThrow(() -> new BusinessException("No pending approval steps"));
    }

    private boolean allStepsApproved(Long documentId) {
        return stepRepository.findByDocumentIdOrderByStepOrderAsc(documentId).stream()
                .allMatch(step -> step.getStatus() == ApprovalStepStatus.APPROVED);
    }

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
