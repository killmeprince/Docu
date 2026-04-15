package io.github.killmeprince.docu.dto.request;

import io.github.killmeprince.docu.enums.ApprovalDecision;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ApprovalDecisionRequest(
        @NotNull ApprovalDecision decision,
        @Size(max = 2000) String comment
) {}
