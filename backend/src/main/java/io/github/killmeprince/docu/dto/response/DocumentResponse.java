package io.github.killmeprince.docu.dto.response;

import java.time.OffsetDateTime;

public record DocumentResponse(
        Long id,
        Long documentTypeId,
        String typeCode,
        String type,
        String registrationNumber,
        OffsetDateTime registrationDate,
        String title,
        String description,
        String authorUsername,
        String author,
        String status,
        OffsetDateTime updatedAt,
        Integer latestVersionNumber,
        String latestFileName,
        String latestFileUrl,
        boolean editable
) {}
