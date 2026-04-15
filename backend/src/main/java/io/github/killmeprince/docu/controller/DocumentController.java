package io.github.killmeprince.docu.controller;

import io.github.killmeprince.docu.dto.request.DocumentCreateRequest;
import io.github.killmeprince.docu.dto.request.DocumentUpdateRequest;
import io.github.killmeprince.docu.dto.response.DocumentDetailsResponse;
import io.github.killmeprince.docu.dto.response.DocumentResponse;
import io.github.killmeprince.docu.dto.response.DocumentVersionResponse;
import io.github.killmeprince.docu.dto.response.ApprovalStepResponse;
import io.github.killmeprince.docu.service.ApprovalService;
import io.github.killmeprince.docu.service.DocumentService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {
    private final DocumentService documentService;
    private final ApprovalService approvalService;

    public DocumentController(DocumentService documentService, ApprovalService approvalService) {
        this.documentService = documentService;
        this.approvalService = approvalService;
    }

    @PostMapping(consumes = {"multipart/form-data"})
    public DocumentResponse create(@RequestPart("payload") @Valid DocumentCreateRequest request,
                                   @RequestPart(value = "file", required = false) MultipartFile file,
                                   Authentication auth) {
        return documentService.create(request, file, auth.getName());
    }

    @PutMapping(value = "/{id}", consumes = {"multipart/form-data"})
    public DocumentResponse update(@PathVariable Long id,
                                   @RequestPart("payload") @Valid DocumentUpdateRequest request,
                                   @RequestPart(value = "file", required = false) MultipartFile file,
                                   Authentication auth) {
        return documentService.update(id, request, file, auth.getName());
    }

    @GetMapping
    public List<DocumentResponse> list(@RequestParam(required = false) String registrationNumber,
                                       @RequestParam(required = false) Long typeId,
                                       @RequestParam(required = false) String author,
                                       @RequestParam(required = false) String status,
                                       Authentication auth) {
        return documentService.search(registrationNumber, typeId, author, status, auth.getName());
    }

    @GetMapping("/{id}")
    public DocumentDetailsResponse get(@PathVariable Long id, Authentication auth) {
        return documentService.getById(id, auth.getName());
    }

    @GetMapping("/{id}/versions")
    public List<DocumentVersionResponse> versions(@PathVariable Long id, Authentication auth) {
        return documentService.getVersions(id, auth.getName());
    }

    @PostMapping("/{id}/send-to-approval")
    public void sendToApproval(@PathVariable Long id, Authentication auth) {
        documentService.sendToApproval(id, auth.getName());
    }

    @GetMapping("/{id}/approval-steps")
    public List<ApprovalStepResponse> steps(@PathVariable Long id, Authentication auth) {
        return approvalService.byDocument(id, auth.getName());
    }
}
