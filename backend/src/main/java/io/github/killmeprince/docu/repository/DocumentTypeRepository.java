package io.github.killmeprince.docu.repository;

import io.github.killmeprince.docu.entity.DocumentType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DocumentTypeRepository extends JpaRepository<DocumentType, Long> {
    boolean existsByCodeIgnoreCase(String code);
    Optional<DocumentType> findByCodeIgnoreCase(String code);
}
