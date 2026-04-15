package io.github.killmeprince.docu.repository;

import io.github.killmeprince.docu.entity.ApprovalStep;
import io.github.killmeprince.docu.enums.ApprovalStepStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ApprovalStepRepository extends JpaRepository<ApprovalStep, Long> {
    List<ApprovalStep> findByDocumentIdOrderByStepOrderAsc(Long documentId);
    Optional<ApprovalStep> findByIdAndApproverUsername(Long id, String username);
    boolean existsByDocumentIdAndApproverUsername(Long documentId, String username);
    long countByStatus(ApprovalStepStatus status);
}
