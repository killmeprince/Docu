package io.github.killmeprince.docu.repository;

import io.github.killmeprince.docu.entity.FileAttachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FileAttachmentRepository extends JpaRepository<FileAttachment, Long> {
    List<FileAttachment> findByVersionIdOrderByIdAsc(Long versionId);
    Optional<FileAttachment> findByStoragePath(String storagePath);
}
