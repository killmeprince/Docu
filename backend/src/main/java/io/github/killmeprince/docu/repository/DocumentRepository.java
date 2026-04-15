package io.github.killmeprince.docu.repository;

import io.github.killmeprince.docu.entity.Document;
import io.github.killmeprince.docu.enums.DocumentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface DocumentRepository extends JpaRepository<Document, Long>, JpaSpecificationExecutor<Document> {
    long countByStatus(DocumentStatus status);
    boolean existsByRegistrationNumberIgnoreCase(String registrationNumber);
    boolean existsByRegistrationNumberIgnoreCaseAndIdNot(String registrationNumber, Long id);
}
