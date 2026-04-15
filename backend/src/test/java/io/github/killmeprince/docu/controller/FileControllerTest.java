package io.github.killmeprince.docu.controller;

import io.github.killmeprince.docu.entity.Document;
import io.github.killmeprince.docu.entity.DocumentType;
import io.github.killmeprince.docu.entity.DocumentVersion;
import io.github.killmeprince.docu.entity.FileAttachment;
import io.github.killmeprince.docu.entity.User;
import io.github.killmeprince.docu.enums.DocumentStatus;
import io.github.killmeprince.docu.repository.FileAttachmentRepository;
import io.github.killmeprince.docu.service.AccessService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;

import static io.github.killmeprince.docu.support.TestDataFactory.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class FileControllerTest {

    @Mock private FileAttachmentRepository fileAttachmentRepository;
    @Mock private AccessService accessService;

    @TempDir Path tempDir;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = ControllerTestSupport.mockMvc(new FileController(tempDir.toString(), fileAttachmentRepository, accessService));
    }

    @Test
    void download_returnsFileForAccessibleDocument() throws Exception {
        User actor = user(2L, "employee", "Employee User", "ROLE_EMPLOYEE");
        Document document = document(10L, documentType(1L, "ORDER", "Order", true), actor, DocumentStatus.DRAFT);
        DocumentVersion version = version(20L, document, 1, "Initial");
        FileAttachment attachment = attachment(30L, version, "doc.txt", "stored.txt");
        Files.writeString(tempDir.resolve("stored.txt"), "content");

        when(fileAttachmentRepository.findByStoragePath("stored.txt")).thenReturn(Optional.of(attachment));
        when(accessService.getRequiredUser("employee")).thenReturn(actor);
        when(accessService.canAccessDocument(actor, document)).thenReturn(true);

        mockMvc.perform(get("/api/files/{filename}", "stored.txt").principal(ControllerTestSupport.auth("employee")))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", "attachment; filename=doc.txt"));
    }
}
