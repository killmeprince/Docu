package io.github.killmeprince.docu.repository;

import io.github.killmeprince.docu.entity.ApprovalRouteTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ApprovalRouteTemplateRepository extends JpaRepository<ApprovalRouteTemplate, Long> {
    Optional<ApprovalRouteTemplate> findByDocumentTypeIdAndActiveTrue(Long documentTypeId);
}
