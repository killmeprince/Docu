package io.github.killmeprince.docu.repository;

import io.github.killmeprince.docu.entity.ApprovalStepTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ApprovalStepTemplateRepository extends JpaRepository<ApprovalStepTemplate, Long> {
    List<ApprovalStepTemplate> findByRouteTemplateIdOrderByStepOrderAsc(Long routeTemplateId);
}
