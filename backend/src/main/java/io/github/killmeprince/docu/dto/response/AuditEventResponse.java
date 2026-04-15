package io.github.killmeprince.docu.dto.response;

import java.time.OffsetDateTime;

public record AuditEventResponse(String actor, String type, String details, OffsetDateTime createdAt) {}
