package io.github.killmeprince.docu.mapper;

import io.github.killmeprince.docu.dto.response.ApprovalStepResponse;
import io.github.killmeprince.docu.entity.ApprovalStep;
import org.springframework.stereotype.Component;

@Component
public class ApprovalMapper {
    public ApprovalStepResponse toResponse(ApprovalStep step) {
        return new ApprovalStepResponse(
                step.getId(),
                step.getStepOrder(),
                step.getApprover().getFullName(),
                step.getStatus().name(),
                step.getComment(),
                step.getDecidedAt()
        );
    }
}
