package io.github.killmeprince.docu.dto.response;

import java.util.Map;

public record ReportResponse(
        long totalDocuments,
        Map<String, Long> byStatus,
        Map<String, Long> byType,
        long reworkCount,
        long inApprovalCount,
        long approvedCount,
        long rejectedCount,
        long pendingStepCount
) {}
