package io.github.killmeprince.docu.mapper;

import io.github.killmeprince.docu.dto.response.DocumentDetailsResponse;
import io.github.killmeprince.docu.dto.response.DocumentResponse;
import io.github.killmeprince.docu.dto.response.DocumentVersionResponse;
import io.github.killmeprince.docu.dto.response.FileAttachmentResponse;
import io.github.killmeprince.docu.entity.Document;
import io.github.killmeprince.docu.entity.DocumentVersion;
import io.github.killmeprince.docu.entity.FileAttachment;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;

@Component
public class DocumentMapper {
    public DocumentResponse toSummaryResponse(Document document,
                                              DocumentVersion latestVersion,
                                              FileAttachment latestAttachment,
                                              boolean editable) {
        return new DocumentResponse(
                document.getId(),
                document.getDocumentType().getId(),
                document.getDocumentType().getCode(),
                document.getDocumentType().getName(),
                document.getRegistrationNumber(),
                document.getRegistrationDate(),
                document.getTitle(),
                document.getDescription(),
                document.getAuthor().getUsername(),
                document.getAuthor().getFullName(),
                document.getStatus().name(),
                document.getUpdatedAt(),
                latestVersion == null ? null : latestVersion.getVersionNumber(),
                latestAttachment == null ? null : latestAttachment.getOriginalName(),
                latestAttachment == null ? null : "/api/files/" + latestAttachment.getStoragePath(),
                editable
        );
    }

    public DocumentDetailsResponse toDetailsResponse(Document document,
                                                     List<DocumentVersionResponse> versionResponses,
                                                     boolean editable) {
        return new DocumentDetailsResponse(
                document.getId(),
                document.getDocumentType().getId(),
                document.getDocumentType().getCode(),
                document.getDocumentType().getName(),
                document.getRegistrationNumber(),
                document.getRegistrationDate(),
                document.getTitle(),
                document.getDescription(),
                document.getAuthor().getUsername(),
                document.getAuthor().getFullName(),
                document.getStatus().name(),
                document.getUpdatedAt(),
                editable,
                versionResponses
        );
    }

    public DocumentVersionResponse toVersionResponse(DocumentVersion version, List<FileAttachment> attachments) {
        List<FileAttachmentResponse> fileResponses = attachments.stream()
                .sorted(Comparator.comparing(FileAttachment::getId))
                .map(this::toFileResponse)
                .toList();
        return new DocumentVersionResponse(
                version.getId(),
                version.getVersionNumber(),
                version.getChangeComment(),
                version.getCreatedAt(),
                fileResponses
        );
    }

    public FileAttachmentResponse toFileResponse(FileAttachment attachment) {
        return new FileAttachmentResponse(
                attachment.getId(),
                attachment.getOriginalName(),
                attachment.getSizeBytes(),
                "/api/files/" + attachment.getStoragePath()
        );
    }
}
