package io.github.killmeprince.docu.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.killmeprince.docu.dto.request.ApprovalDecisionRequest;
import io.github.killmeprince.docu.dto.request.DocumentCreateRequest;
import io.github.killmeprince.docu.dto.request.DocumentUpdateRequest;
import io.github.killmeprince.docu.entity.ApprovalStep;
import io.github.killmeprince.docu.entity.Document;
import io.github.killmeprince.docu.enums.ApprovalDecision;
import io.github.killmeprince.docu.enums.ApprovalStepStatus;
import io.github.killmeprince.docu.enums.AuditEventType;
import io.github.killmeprince.docu.enums.DocumentStatus;
import io.github.killmeprince.docu.repository.ApprovalStepRepository;
import io.github.killmeprince.docu.repository.AuditEventRepository;
import io.github.killmeprince.docu.repository.DocumentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class DocumentReworkRejectFlowIntegrationTest {

    private static final Path STORAGE_DIR = Path.of("target/test-storage");

    @Autowired private WebApplicationContext webApplicationContext;
    @Autowired private DocumentRepository documentRepository;
    @Autowired private ApprovalStepRepository approvalStepRepository;
    @Autowired private AuditEventRepository auditEventRepository;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() throws IOException {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();

        if (Files.exists(STORAGE_DIR)) {
            try (var paths = Files.walk(STORAGE_DIR)) {
                paths.sorted(java.util.Comparator.reverseOrder())
                        .filter(path -> !path.equals(STORAGE_DIR))
                        .forEach(path -> {
                            try {
                                Files.deleteIfExists(path);
                            } catch (IOException ex) {
                                throw new RuntimeException(ex);
                            }
                        });
            }
        }
        Files.createDirectories(STORAGE_DIR);
    }

    @Test
    void createReworkUpdateResendReject_persistsFinalRejectedStateAndSecondVersion() throws Exception {
        long documentId = createDocument(
                new DocumentCreateRequest(
                        2L,
                        "IT-REWORK-001",
                        "Integration rework flow",
                        "Initial description",
                        "Initial version"
                ),
                "employee",
                "ROLE_EMPLOYEE",
                new MockMultipartFile("file", "initial.txt", MediaType.TEXT_PLAIN_VALUE, "initial-content".getBytes())
        );

        sendToApproval(documentId, "employee", "ROLE_EMPLOYEE");
        long firstStepId = firstApprovalStepId(documentId);

        decide(firstStepId, ApprovalDecision.REWORK, "Need corrections", "approver", "ROLE_APPROVER");

        mockMvc.perform(get("/api/documents/{id}", documentId)
                        .with(userWithAuthority("employee", "ROLE_EMPLOYEE")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REWORK"))
                .andExpect(jsonPath("$.editable").value(true));

        updateDocument(
                documentId,
                new DocumentUpdateRequest(
                        2L,
                        "Integration rework flow updated",
                        "Updated description after rework",
                        "Second version after rework"
                ),
                "employee",
                "ROLE_EMPLOYEE",
                new MockMultipartFile("file", "updated.txt", MediaType.TEXT_PLAIN_VALUE, "updated-content".getBytes())
        );

        mockMvc.perform(get("/api/documents/{id}/versions", documentId)
                        .with(userWithAuthority("employee", "ROLE_EMPLOYEE")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].versionNumber").value(2))
                .andExpect(jsonPath("$[0].changeComment").value("Second version after rework"))
                .andExpect(jsonPath("$[1].versionNumber").value(1));

        sendToApproval(documentId, "employee", "ROLE_EMPLOYEE");
        long secondStepId = firstApprovalStepId(documentId);

        decide(secondStepId, ApprovalDecision.REJECT, "Final rejection", "approver", "ROLE_APPROVER");

        mockMvc.perform(get("/api/documents/{id}", documentId)
                        .with(userWithAuthority("employee", "ROLE_EMPLOYEE")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"))
                .andExpect(jsonPath("$.editable").value(false));

        Document document = documentRepository.findById(documentId).orElseThrow();
        assertEquals(DocumentStatus.REJECTED, document.getStatus());
        assertEquals("Integration rework flow updated", document.getTitle());
        assertEquals("Updated description after rework", document.getDescription());

        List<ApprovalStep> steps = approvalStepRepository.findByDocumentIdOrderByStepOrderAsc(documentId);
        assertEquals(1, steps.size());
        assertEquals(ApprovalStepStatus.REJECTED, steps.get(0).getStatus());
        assertEquals("Final rejection", steps.get(0).getComment());
        assertNotNull(steps.get(0).getDecidedAt());

        List<String> auditTypes = auditEventRepository.findByDocumentIdOrderByCreatedAtDesc(documentId).stream()
                .map(event -> event.getType().name())
                .toList();

        assertEquals(2, auditTypes.stream().filter(AuditEventType.VERSION_CREATED.name()::equals).count());
        assertEquals(2, auditTypes.stream().filter(AuditEventType.DOCUMENT_SENT_FOR_APPROVAL.name()::equals).count());
        assertEquals(2, auditTypes.stream().filter(AuditEventType.APPROVAL_DECISION.name()::equals).count());
        assertEquals(4, auditTypes.stream().filter(AuditEventType.DOCUMENT_STATUS_CHANGED.name()::equals).count());
        assertTrue(auditTypes.contains(AuditEventType.DOCUMENT_EDITED.name()));

        mockMvc.perform(get("/api/audit/documents/{id}", documentId)
                        .with(userWithAuthority("employee", "ROLE_EMPLOYEE")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].type").exists());
    }

    private long createDocument(DocumentCreateRequest payload,
                                String username,
                                String authority,
                                MockMultipartFile file) throws Exception {
        MockMultipartFile jsonPart = new MockMultipartFile(
                "payload",
                "",
                MediaType.APPLICATION_JSON_VALUE,
                objectMapper.writeValueAsBytes(payload)
        );

        MvcResult result = mockMvc.perform(multipart("/api/documents")
                        .file(jsonPart)
                        .file(file)
                        .with(userWithAuthority(username, authority)))
                .andReturn();

        int status = result.getResponse().getStatus();
        String body = result.getResponse().getContentAsString();

        assertEquals(200, status, "Create document failed. Response body: " + body);
        JsonNode json = objectMapper.readTree(body);
        assertEquals(payload.registrationNumber(), json.get("registrationNumber").asText());
        return json.get("id").asLong();
    }

    private void updateDocument(long documentId,
                                DocumentUpdateRequest payload,
                                String username,
                                String authority,
                                MockMultipartFile file) throws Exception {
        MockMultipartFile jsonPart = new MockMultipartFile(
                "payload",
                "",
                MediaType.APPLICATION_JSON_VALUE,
                objectMapper.writeValueAsBytes(payload)
        );

        MvcResult result = mockMvc.perform(multipart("/api/documents/{id}", documentId)
                        .file(jsonPart)
                        .file(file)
                        .with(request -> {
                            request.setMethod("PUT");
                            return request;
                        })
                        .with(userWithAuthority(username, authority)))
                .andReturn();

        int status = result.getResponse().getStatus();
        String body = result.getResponse().getContentAsString();

        assertEquals(200, status, "Update document failed. Response body: " + body);
    }

    private void sendToApproval(long documentId, String username, String authority) throws Exception {
        mockMvc.perform(post("/api/documents/{id}/send-to-approval", documentId)
                        .with(userWithAuthority(username, authority)))
                .andExpect(status().isOk());
    }

    private void decide(long stepId,
                        ApprovalDecision decision,
                        String comment,
                        String username,
                        String authority) throws Exception {
        mockMvc.perform(post("/api/approvals/steps/{id}/decision", stepId)
                        .with(userWithAuthority(username, authority))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new ApprovalDecisionRequest(decision, comment))))
                .andExpect(status().isOk());
    }

    private long firstApprovalStepId(long documentId) throws Exception {
        MvcResult result = mockMvc.perform(get("/api/documents/{id}/approval-steps", documentId)
                        .with(userWithAuthority("employee", "ROLE_EMPLOYEE")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("PENDING"))
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsByteArray())
                .get(0)
                .get("id")
                .asLong();
    }

    private SecurityMockMvcRequestPostProcessors.UserRequestPostProcessor userWithAuthority(String username, String authority) {
        return user(username).authorities(new SimpleGrantedAuthority(authority));
    }
}