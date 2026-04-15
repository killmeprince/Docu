package io.github.killmeprince.docu.mapper;


import io.github.killmeprince.docu.dto.response.AuditEventResponse;
import io.github.killmeprince.docu.entity.AuditEvent;
import org.springframework.stereotype.Component;

@Component
public class AuditMapper {
    public AuditEventResponse toResponse(AuditEvent event) {
        return new AuditEventResponse(event.getActor().getFullName(), event.getType().name(), event.getDetails(), event.getCreatedAt());
    }
}

