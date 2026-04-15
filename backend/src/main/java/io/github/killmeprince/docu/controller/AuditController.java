package io.github.killmeprince.docu.controller;

import io.github.killmeprince.docu.dto.response.AuditEventResponse;
import io.github.killmeprince.docu.service.AuditService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit")
public class AuditController {
    private final AuditService auditService;

    public AuditController(AuditService auditService) {
        this.auditService = auditService;
    }

    @GetMapping("/documents/{documentId}")
    public List<AuditEventResponse> byDocument(@PathVariable Long documentId, Authentication auth) {
        return auditService.getDocumentAudit(documentId, auth.getName());
    }
}
