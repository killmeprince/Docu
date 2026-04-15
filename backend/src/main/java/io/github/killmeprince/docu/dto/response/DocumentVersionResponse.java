package io.github.killmeprince.docu.dto.response;

import java.time.OffsetDateTime;
import java.util.List;

public record DocumentVersionResponse(
        Long id,
        Integer versionNumber,
        String changeComment,
        OffsetDateTime createdAt,
        List<FileAttachmentResponse> attachments
) {}
