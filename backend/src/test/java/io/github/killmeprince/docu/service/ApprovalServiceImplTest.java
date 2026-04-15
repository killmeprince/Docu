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
import io.github.killmeprince.docu.mapper.ApprovalMapper;
import io.github.killmeprince.docu.repository.ApprovalStepRepository;
import io.github.killmeprince.docu.repository.DocumentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static io.github.killmeprince.docu.support.TestDataFactory.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ApprovalServiceImplTest {

    @Mock private ApprovalStepRepository stepRepository;
    @Mock private DocumentRepository documentRepository;
    @Mock private AuditService auditService;
    @Mock private ApprovalMapper mapper;
    @Mock private AccessService accessService;

    @InjectMocks private ApprovalServiceImpl approvalService;

    private User approver;
    private User author;
    private Document document;
    private ApprovalStep step;

    @BeforeEach
    void setUp() {
        approver = user(3L, "approver", "Approver User", "ROLE_APPROVER");
        author = user(2L, "employee", "Employee User", "ROLE_EMPLOYEE");
        document = document(10L, documentType(1L, "ORDER", "Order", true), author, DocumentStatus.IN_APPROVAL);
        step = approvalStep(100L, document, approver, 1, ApprovalStepStatus.PENDING);
    }

    @Test
    void decide_setsDocumentApprovedWhenAllStepsApproved() {
        when(accessService.getRequiredUser("approver")).thenReturn(approver);
        when(stepRepository.findByIdAndApproverUsername(100L, "approver")).thenReturn(Optional.of(step));
        when(accessService.canAccessDocument(approver, document)).thenReturn(true);
        when(stepRepository.findByDocumentIdOrderByStepOrderAsc(10L)).thenReturn(List.of(step));

        approvalService.decide(100L, new ApprovalDecisionRequest(ApprovalDecision.APPROVE, "Looks good"), "approver");

        assertEquals(ApprovalStepStatus.APPROVED, step.getStatus());
        assertEquals(DocumentStatus.APPROVED, document.getStatus());
        verify(auditService).log(10L, "approver", AuditEventType.APPROVAL_DECISION, "Decision: APPROVE. Looks good");
        verify(auditService).log(10L, "approver", AuditEventType.DOCUMENT_STATUS_CHANGED, "Status changed to APPROVED");
    }

    @Test
    void decide_setsReworkStatus() {
        when(accessService.getRequiredUser("approver")).thenReturn(approver);
        when(stepRepository.findByIdAndApproverUsername(100L, "approver")).thenReturn(Optional.of(step));
        when(accessService.canAccessDocument(approver, document)).thenReturn(true);
        when(stepRepository.findByDocumentIdOrderByStepOrderAsc(10L)).thenReturn(List.of(step));

        approvalService.decide(100L, new ApprovalDecisionRequest(ApprovalDecision.REWORK, "Needs changes"), "approver");

        assertEquals(ApprovalStepStatus.REWORK, step.getStatus());
        assertEquals(DocumentStatus.REWORK, document.getStatus());
    }

    @Test
    void decide_rejectsNonCurrentStep() {
        ApprovalStep current = approvalStep(101L, document, approver, 1, ApprovalStepStatus.PENDING);
        when(accessService.getRequiredUser("approver")).thenReturn(approver);
        when(stepRepository.findByIdAndApproverUsername(100L, "approver")).thenReturn(Optional.of(step));
        when(accessService.canAccessDocument(approver, document)).thenReturn(true);
        when(stepRepository.findByDocumentIdOrderByStepOrderAsc(10L)).thenReturn(List.of(current, step));

        assertThrows(BusinessException.class,
                () -> approvalService.decide(100L, new ApprovalDecisionRequest(ApprovalDecision.APPROVE, null), "approver"));
    }

    @Test
    void decide_rejectsAlreadyDecidedStep() {
        step.setStatus(ApprovalStepStatus.APPROVED);
        when(accessService.getRequiredUser("approver")).thenReturn(approver);
        when(stepRepository.findByIdAndApproverUsername(100L, "approver")).thenReturn(Optional.of(step));
        when(accessService.canAccessDocument(approver, document)).thenReturn(true);

        assertThrows(BusinessException.class,
                () -> approvalService.decide(100L, new ApprovalDecisionRequest(ApprovalDecision.APPROVE, null), "approver"));
    }

    @Test
    void byDocument_returnsMappedResponsesForAccessibleDocument() {
        ApprovalStepResponse response = approvalStepResponse(100L);
        when(accessService.getRequiredUser("approver")).thenReturn(approver);
        when(documentRepository.findById(10L)).thenReturn(Optional.of(document));
        when(accessService.canAccessDocument(approver, document)).thenReturn(true);
        when(stepRepository.findByDocumentIdOrderByStepOrderAsc(10L)).thenReturn(List.of(step));
        when(mapper.toResponse(step)).thenReturn(response);

        List<ApprovalStepResponse> result = approvalService.byDocument(10L, "approver");

        assertEquals(List.of(response), result);
    }
}
