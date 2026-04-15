package io.github.killmeprince.docu.controller;

import io.github.killmeprince.docu.dto.request.ApprovalDecisionRequest;
import io.github.killmeprince.docu.enums.ApprovalDecision;
import io.github.killmeprince.docu.service.ApprovalService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.doNothing;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ApprovalControllerTest {

    @Mock private ApprovalService approvalService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = ControllerTestSupport.mockMvc(new ApprovalController(approvalService));
    }

    @Test
    void decide_returnsOk() throws Exception {
        doNothing().when(approvalService).decide(100L, new ApprovalDecisionRequest(ApprovalDecision.APPROVE, "Looks good"), "approver");

        mockMvc.perform(post("/api/approvals/steps/{id}/decision", 100L)
                        .principal(ControllerTestSupport.auth("approver"))
                        .contentType("application/json")
                        .content(ControllerTestSupport.objectMapper().writeValueAsBytes(new ApprovalDecisionRequest(ApprovalDecision.APPROVE, "Looks good"))))
                .andExpect(status().isOk());
    }
}
