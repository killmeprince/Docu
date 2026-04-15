package io.github.killmeprince.docu.service;

import io.github.killmeprince.docu.dto.response.ReportResponse;
import io.github.killmeprince.docu.enums.ApprovalStepStatus;
import io.github.killmeprince.docu.enums.DocumentStatus;
import io.github.killmeprince.docu.exception.BusinessException;
import io.github.killmeprince.docu.repository.ApprovalStepRepository;
import io.github.killmeprince.docu.repository.DocumentRepository;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ReportServiceImpl implements ReportService {
    private final DocumentRepository documentRepository;
    private final ApprovalStepRepository approvalStepRepository;
    private final AccessService accessService;

    public ReportServiceImpl(DocumentRepository documentRepository,
                             ApprovalStepRepository approvalStepRepository,
                             AccessService accessService) {
        this.documentRepository = documentRepository;
        this.approvalStepRepository = approvalStepRepository;
        this.accessService = accessService;
    }

    @Override
    public ReportResponse summary(String username) {
        var actor = accessService.getRequiredUser(username);
        if (!accessService.canViewReports(actor)) {
            throw new BusinessException("Current role cannot view reports");
        }
        var allDocs = documentRepository.findAll();
        Map<String, Long> byStatus = allDocs.stream()
                .collect(Collectors.groupingBy(d -> d.getStatus().name(), Collectors.counting()));
        Map<String, Long> byType = allDocs.stream()
                .collect(Collectors.groupingBy(d -> d.getDocumentType().getName(), Collectors.counting()));
        long reworkCount = approvalStepRepository.countByStatus(ApprovalStepStatus.REWORK);
        long inApprovalCount = documentRepository.countByStatus(DocumentStatus.IN_APPROVAL);
        long approvedCount = documentRepository.countByStatus(DocumentStatus.APPROVED);
        long rejectedCount = documentRepository.countByStatus(DocumentStatus.REJECTED);
        long pendingStepCount = approvalStepRepository.countByStatus(ApprovalStepStatus.PENDING);
        return new ReportResponse(allDocs.size(), byStatus, byType, reworkCount, inApprovalCount, approvedCount, rejectedCount, pendingStepCount);
    }
}
