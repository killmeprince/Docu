package io.github.killmeprince.docu.mapper;

import io.github.killmeprince.docu.dto.response.AuditEventResponse;
import io.github.killmeprince.docu.entity.AuditEvent;
import io.github.killmeprince.docu.enums.AuditEventType;
import io.github.killmeprince.docu.enums.DocumentStatus;
import org.junit.jupiter.api.Test;

import static io.github.killmeprince.docu.support.TestDataFactory.*;
import static org.junit.jupiter.api.Assertions.assertEquals;

class AuditMapperTest {

    private final AuditMapper mapper = new AuditMapper();

    @Test
    void toResponse_mapsAuditEvent() {
        AuditEvent event = auditEvent(1L,
                document(10L, documentType(1L, "ORDER", "Order", true), user(2L, "employee", "Employee User", "ROLE_EMPLOYEE"), DocumentStatus.DRAFT),
                user(2L, "employee", "Employee User", "ROLE_EMPLOYEE"),
                AuditEventType.DOCUMENT_CREATED,
                "Created");

        AuditEventResponse response = mapper.toResponse(event);

        assertEquals("Employee User", response.actor());
        assertEquals("DOCUMENT_CREATED", response.type());
        assertEquals("Created", response.details());
    }
}
