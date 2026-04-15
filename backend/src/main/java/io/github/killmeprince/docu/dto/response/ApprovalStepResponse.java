package io.github.killmeprince.docu.dto.response;

import java.time.OffsetDateTime;

public record ApprovalStepResponse(
        Long id,
        Integer order,
        String approver,
        String status,
        String comment,
        OffsetDateTime decidedAt
) {}