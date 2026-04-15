package io.github.killmeprince.docu.service;

import io.github.killmeprince.docu.dto.response.AuditEventResponse;
import io.github.killmeprince.docu.enums.AuditEventType;

import java.util.List;

public interface AuditService {
    void log(Long documentId, String username, AuditEventType type, String details);
    List<AuditEventResponse> getDocumentAudit(Long documentId, String username);
}
