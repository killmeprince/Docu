package io.github.killmeprince.docu.dto.response;

import java.time.OffsetDateTime;
import java.util.List;

public record DocumentDetailsResponse(
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
        boolean editable,
        List<DocumentVersionResponse> versions
) {}
