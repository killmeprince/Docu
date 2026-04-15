package io.github.killmeprince.docu.repository;

import io.github.killmeprince.docu.entity.DocumentVersion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DocumentVersionRepository extends JpaRepository<DocumentVersion, Long> {
    Optional<DocumentVersion> findTopByDocumentIdOrderByVersionNumberDesc(Long documentId);
    List<DocumentVersion> findByDocumentIdOrderByVersionNumberDesc(Long documentId);
}
