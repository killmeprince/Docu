package io.github.killmeprince.docu.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.killmeprince.docu.dto.request.ApprovalDecisionRequest;
import io.github.killmeprince.docu.dto.request.DocumentCreateRequest;
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
import org.springframework.web.context.WebApplicationContext;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class DocumentApprovalFlowIntegrationTest {

    private static final Path STORAGE_DIR = Path.of("./target/test-storage");

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
    void createSendApprove_persistsApprovedDocumentAndAuditTrail() throws Exception {
        long documentId = createDocument(
                new DocumentCreateRequest(2L, "IT-APPROVE-001", "Integration approve flow", "Flow description", "Initial version"),
                "employee",
                "ROLE_EMPLOYEE",
                new MockMultipartFile("file", "flow.txt", MediaType.TEXT_PLAIN_VALUE, "content".getBytes())
        );

        mockMvc.perform(post("/api/documents/{id}/send-to-approval", documentId)
                        .with(userWithAuthority("employee", "ROLE_EMPLOYEE")))
                .andExpect(status().isOk());

        long stepId = firstApprovalStepId(documentId);

        mockMvc.perform(post("/api/approvals/steps/{id}/decision", stepId)
                        .with(userWithAuthority("approver", "ROLE_APPROVER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(
                                new ApprovalDecisionRequest(ApprovalDecision.APPROVE, "Approved in integration test")
                        )))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/documents/{id}", documentId)
                        .with(userWithAuthority("employee", "ROLE_EMPLOYEE")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"))
                .andExpect(jsonPath("$.editable").value(false));

        Document document = documentRepository.findById(documentId).orElseThrow();
        assertEquals(DocumentStatus.APPROVED, document.getStatus());

        ApprovalStep step = approvalStepRepository.findByDocumentIdOrderByStepOrderAsc(documentId).get(0);
        assertEquals(ApprovalStepStatus.APPROVED, step.getStatus());
        assertEquals("Approved in integration test", step.getComment());
        assertNotNull(step.getDecidedAt());

        List<String> auditTypes = auditEventRepository.findByDocumentIdOrderByCreatedAtDesc(documentId).stream()
                .map(event -> event.getType().name())
                .toList();

        assertTrue(auditTypes.contains(AuditEventType.DOCUMENT_CREATED.name()));
        assertTrue(auditTypes.contains(AuditEventType.VERSION_CREATED.name()));
        assertTrue(auditTypes.contains(AuditEventType.DOCUMENT_SENT_FOR_APPROVAL.name()));
        assertTrue(auditTypes.contains(AuditEventType.APPROVAL_DECISION.name()));
        assertEquals(2, auditTypes.stream().filter(AuditEventType.DOCUMENT_STATUS_CHANGED.name()::equals).count());

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
        assertEquals(payload.registrationNumber(), objectMapper.readTree(body).get("registrationNumber").asText());

        JsonNode json = objectMapper.readTree(body);
        return json.get("id").asLong();
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