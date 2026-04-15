package io.github.killmeprince.docu.repository;

import io.github.killmeprince.docu.entity.AuditEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditEventRepository extends JpaRepository<AuditEvent, Long> {
    List<AuditEvent> findByDocumentIdOrderByCreatedAtDesc(Long documentId);
}
