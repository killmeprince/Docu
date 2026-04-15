package io.github.killmeprince.docu.controller;

import io.github.killmeprince.docu.service.ReportService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;

import static io.github.killmeprince.docu.support.TestDataFactory.reportResponse;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ReportControllerTest {

    @Mock private ReportService reportService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = ControllerTestSupport.mockMvc(new ReportController(reportService));
    }

    @Test
    void summary_returnsReport() throws Exception {
        when(reportService.summary("approver")).thenReturn(reportResponse());

        mockMvc.perform(get("/api/reports/summary").principal(ControllerTestSupport.auth("approver")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalDocuments").value(3));
    }
}
