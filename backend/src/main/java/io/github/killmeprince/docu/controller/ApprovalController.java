package io.github.killmeprince.docu.controller;

import io.github.killmeprince.docu.dto.request.ApprovalDecisionRequest;
import io.github.killmeprince.docu.service.ApprovalService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/approvals")
public class ApprovalController {
    private final ApprovalService approvalService;

    public ApprovalController(ApprovalService approvalService) {
        this.approvalService = approvalService;
    }

    @PostMapping("/steps/{id}/decision")
    @PreAuthorize("hasAuthority('ROLE_APPROVER')")
    public void decide(@PathVariable Long id, @RequestBody @Valid ApprovalDecisionRequest request, Authentication auth) {
        approvalService.decide(id, request, auth.getName());
    }
}
