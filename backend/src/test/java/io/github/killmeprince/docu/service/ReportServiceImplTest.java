package io.github.killmeprince.docu.service;

import io.github.killmeprince.docu.dto.response.ReportResponse;
import io.github.killmeprince.docu.entity.Document;
import io.github.killmeprince.docu.entity.User;
import io.github.killmeprince.docu.enums.ApprovalStepStatus;
import io.github.killmeprince.docu.enums.DocumentStatus;
import io.github.killmeprince.docu.exception.BusinessException;
import io.github.killmeprince.docu.repository.ApprovalStepRepository;
import io.github.killmeprince.docu.repository.DocumentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static io.github.killmeprince.docu.support.TestDataFactory.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReportServiceImplTest {

    @Mock private DocumentRepository documentRepository;
    @Mock private ApprovalStepRepository approvalStepRepository;
    @Mock private AccessService accessService;

    @InjectMocks private ReportServiceImpl reportService;

    private User approver;
    private List<Document> documents;

    @BeforeEach
    void setUp() {
        approver = user(3L, "approver", "Approver User", "ROLE_APPROVER");
        var type = documentType(1L, "ORDER", "Order", true);
        var author = user(2L, "employee", "Employee User", "ROLE_EMPLOYEE");
        Document draft = document(1L, type, author, DocumentStatus.DRAFT);
        Document approved = document(2L, type, author, DocumentStatus.APPROVED);
        documents = List.of(draft, approved);
    }

    @Test
    void summary_returnsAggregates() {
        when(accessService.getRequiredUser("approver")).thenReturn(approver);
        when(accessService.canViewReports(approver)).thenReturn(true);
        when(documentRepository.findAll()).thenReturn(documents);
        when(approvalStepRepository.countByStatus(ApprovalStepStatus.REWORK)).thenReturn(1L);
        when(documentRepository.countByStatus(DocumentStatus.IN_APPROVAL)).thenReturn(2L);
        when(documentRepository.countByStatus(DocumentStatus.APPROVED)).thenReturn(3L);
        when(documentRepository.countByStatus(DocumentStatus.REJECTED)).thenReturn(4L);
        when(approvalStepRepository.countByStatus(ApprovalStepStatus.PENDING)).thenReturn(5L);

        ReportResponse result = reportService.summary("approver");

        assertEquals(2L, result.totalDocuments());
        assertEquals(1L, result.byStatus().get("DRAFT"));
        assertEquals(2L, result.byType().get("Order"));
        assertEquals(5L, result.pendingStepCount());
    }

    @Test
    void summary_throwsWhenRoleCannotViewReports() {
        when(accessService.getRequiredUser("approver")).thenReturn(approver);
        when(accessService.canViewReports(approver)).thenReturn(false);

        assertThrows(BusinessException.class, () -> reportService.summary("approver"));
    }
}
