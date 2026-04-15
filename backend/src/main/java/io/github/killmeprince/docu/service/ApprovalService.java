package io.github.killmeprince.docu.service;

import io.github.killmeprince.docu.dto.request.ApprovalDecisionRequest;
import io.github.killmeprince.docu.dto.response.ApprovalStepResponse;

import java.util.List;

public interface ApprovalService {
    void decide(Long stepId, ApprovalDecisionRequest request, String username);
    List<ApprovalStepResponse> byDocument(Long documentId, String username);
}
