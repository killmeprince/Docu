package io.github.killmeprince.docu.controller;

import io.github.killmeprince.docu.dto.request.DocumentCreateRequest;
import io.github.killmeprince.docu.dto.request.DocumentUpdateRequest;
import io.github.killmeprince.docu.service.ApprovalService;
import io.github.killmeprince.docu.service.DocumentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static io.github.killmeprince.docu.support.TestDataFactory.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class DocumentControllerTest {

    @Mock private DocumentService documentService;
    @Mock private ApprovalService approvalService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = ControllerTestSupport.mockMvc(new DocumentController(documentService, approvalService));
    }

    @Test
    void create_returnsCreatedDocument() throws Exception {
        when(documentService.create(any(DocumentCreateRequest.class), any(), eq("employee"))).thenReturn(documentResponse(10L));
        MockMultipartFile payload = ControllerTestSupport.jsonPart("payload", new DocumentCreateRequest(1L, "REG-001", "Title", "Description", null));
        MockMultipartFile file = new MockMultipartFile("file", "doc.txt", "text/plain", "content".getBytes());

        mockMvc.perform(multipart("/api/documents").file(payload).file(file).principal(ControllerTestSupport.auth("employee")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10L))
                .andExpect(jsonPath("$.registrationNumber").value("REG-001"));
    }

    @Test
    void update_returnsUpdatedDocument() throws Exception {
        when(documentService.update(eq(10L), any(DocumentUpdateRequest.class), any(), eq("employee"))).thenReturn(documentResponse(10L));
        MockMultipartFile payload = ControllerTestSupport.jsonPart("payload", new DocumentUpdateRequest(1L, "Updated", "Description", "Refined"));
        MockMultipartFile file = new MockMultipartFile("file", "doc.txt", "text/plain", "content".getBytes());

        mockMvc.perform(multipart("/api/documents/{id}", 10L)
                        .file(payload)
                        .file(file)
                        .with(request -> { request.setMethod("PUT"); return request; })
                        .principal(ControllerTestSupport.auth("employee")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10L));
    }

    @Test
    void list_returnsDocuments() throws Exception {
        when(documentService.search(any(), any(), any(), any(), eq("employee"))).thenReturn(List.of(documentResponse(10L)));

        mockMvc.perform(get("/api/documents").principal(ControllerTestSupport.auth("employee")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(10L));
    }

    @Test
    void get_returnsDetails() throws Exception {
        when(documentService.getById(10L, "employee")).thenReturn(documentDetailsResponse(10L));

        mockMvc.perform(get("/api/documents/{id}", 10L).principal(ControllerTestSupport.auth("employee")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10L))
                .andExpect(jsonPath("$.versions[0].id").value(10L));
    }

    @Test
    void versions_returnsVersionList() throws Exception {
        when(documentService.getVersions(10L, "employee")).thenReturn(List.of(documentVersionResponse(10L)));

        mockMvc.perform(get("/api/documents/{id}/versions", 10L).principal(ControllerTestSupport.auth("employee")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(10L));
    }

    @Test
    void sendToApproval_returnsOk() throws Exception {
        doNothing().when(documentService).sendToApproval(10L, "employee");

        mockMvc.perform(post("/api/documents/{id}/send-to-approval", 10L).principal(ControllerTestSupport.auth("employee")))
                .andExpect(status().isOk());
    }

    @Test
    void steps_returnsApprovalSteps() throws Exception {
        when(approvalService.byDocument(10L, "employee")).thenReturn(List.of(approvalStepResponse(100L)));

        mockMvc.perform(get("/api/documents/{id}/approval-steps", 10L).principal(ControllerTestSupport.auth("employee")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(100L));
    }
}
