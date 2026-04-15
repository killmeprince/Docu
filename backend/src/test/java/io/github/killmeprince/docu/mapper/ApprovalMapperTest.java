package io.github.killmeprince.docu.mapper;

import io.github.killmeprince.docu.dto.response.ApprovalStepResponse;
import io.github.killmeprince.docu.entity.ApprovalStep;
import io.github.killmeprince.docu.enums.ApprovalStepStatus;
import org.junit.jupiter.api.Test;

import static io.github.killmeprince.docu.support.TestDataFactory.*;
import static org.junit.jupiter.api.Assertions.assertEquals;

class ApprovalMapperTest {

    private final ApprovalMapper mapper = new ApprovalMapper();

    @Test
    void toResponse_mapsApprovalStep() {
        ApprovalStep step = approvalStep(100L,
                document(10L, documentType(1L, "ORDER", "Order", true), user(2L, "employee", "Employee User", "ROLE_EMPLOYEE"), io.github.killmeprince.docu.enums.DocumentStatus.IN_APPROVAL),
                user(3L, "approver", "Approver User", "ROLE_APPROVER"), 1, ApprovalStepStatus.PENDING);

        ApprovalStepResponse response = mapper.toResponse(step);

        assertEquals(100L, response.id());
        assertEquals("Approver User", response.approver());
        assertEquals("PENDING", response.status());
    }
}
