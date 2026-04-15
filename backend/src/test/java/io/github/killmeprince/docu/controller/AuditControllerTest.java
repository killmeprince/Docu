package io.github.killmeprince.docu.controller;

import io.github.killmeprince.docu.service.AuditService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static io.github.killmeprince.docu.support.TestDataFactory.auditEventResponse;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AuditControllerTest {

    @Mock private AuditService auditService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = ControllerTestSupport.mockMvc(new AuditController(auditService));
    }

    @Test
    void byDocument_returnsAuditEvents() throws Exception {
        when(auditService.getDocumentAudit(10L, "employee")).thenReturn(List.of(auditEventResponse()));

        mockMvc.perform(get("/api/audit/documents/{documentId}", 10L).principal(ControllerTestSupport.auth("employee")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].actor").value("Employee User"));
    }
}
