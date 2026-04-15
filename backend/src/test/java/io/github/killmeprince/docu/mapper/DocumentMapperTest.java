package io.github.killmeprince.docu.mapper;

import io.github.killmeprince.docu.dto.response.DocumentDetailsResponse;
import io.github.killmeprince.docu.dto.response.DocumentResponse;
import io.github.killmeprince.docu.dto.response.DocumentVersionResponse;
import io.github.killmeprince.docu.dto.response.FileAttachmentResponse;
import io.github.killmeprince.docu.entity.Document;
import io.github.killmeprince.docu.entity.DocumentVersion;
import io.github.killmeprince.docu.entity.FileAttachment;
import io.github.killmeprince.docu.enums.DocumentStatus;
import org.junit.jupiter.api.Test;

import java.util.List;

import static io.github.killmeprince.docu.support.TestDataFactory.*;
import static org.junit.jupiter.api.Assertions.*;

class DocumentMapperTest {

    private final DocumentMapper mapper = new DocumentMapper();

    @Test
    void toSummaryResponse_mapsLatestVersionAndAttachment() {
        Document document = document(10L, documentType(1L, "ORDER", "Order", true), user(2L, "employee", "Employee User", "ROLE_EMPLOYEE"), DocumentStatus.DRAFT);
        DocumentVersion version = version(20L, document, 3, "Updated");
        FileAttachment attachment = attachment(30L, version, "doc.pdf", "stored.pdf");

        DocumentResponse result = mapper.toSummaryResponse(document, version, attachment, true);

        assertEquals(10L, result.id());
        assertEquals(3, result.latestVersionNumber());
        assertEquals("/api/files/stored.pdf", result.latestFileUrl());
        assertTrue(result.editable());
    }

    @Test
    void toDetailsResponse_mapsVersions() {
        Document document = document(10L, documentType(1L, "ORDER", "Order", true), user(2L, "employee", "Employee User", "ROLE_EMPLOYEE"), DocumentStatus.DRAFT);
        DocumentDetailsResponse result = mapper.toDetailsResponse(document, List.of(documentVersionResponse(20L)), true);

        assertEquals(10L, result.id());
        assertEquals(1, result.versions().size());
    }

    @Test
    void toVersionResponse_sortsAttachmentsById() {
        Document document = document(10L, documentType(1L, "ORDER", "Order", true), user(2L, "employee", "Employee User", "ROLE_EMPLOYEE"), DocumentStatus.DRAFT);
        DocumentVersion version = version(20L, document, 1, "Initial");
        FileAttachment second = attachment(2L, version, "b.pdf", "b.pdf");
        FileAttachment first = attachment(1L, version, "a.pdf", "a.pdf");

        DocumentVersionResponse result = mapper.toVersionResponse(version, List.of(second, first));

        assertEquals(2, result.attachments().size());
        assertEquals(1L, result.attachments().get(0).id());
    }

    @Test
    void toFileResponse_buildsDownloadUrl() {
        Document document = document(10L, documentType(1L, "ORDER", "Order", true), user(2L, "employee", "Employee User", "ROLE_EMPLOYEE"), DocumentStatus.DRAFT);
        DocumentVersion version = version(20L, document, 1, "Initial");
        FileAttachment file = attachment(1L, version, "doc.pdf", "stored.pdf");

        FileAttachmentResponse result = mapper.toFileResponse(file);

        assertEquals("/api/files/stored.pdf", result.downloadUrl());
    }
}
