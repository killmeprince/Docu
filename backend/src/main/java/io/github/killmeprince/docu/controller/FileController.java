package io.github.killmeprince.docu.controller;

import io.github.killmeprince.docu.exception.BusinessException;
import io.github.killmeprince.docu.exception.NotFoundException;
import io.github.killmeprince.docu.repository.FileAttachmentRepository;
import io.github.killmeprince.docu.service.AccessService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;

@RestController
@RequestMapping("/api/files")
public class FileController {
    private final Path storagePath;
    private final FileAttachmentRepository fileAttachmentRepository;
    private final AccessService accessService;

    public FileController(@Value("${app.storage.path}") String storagePath,
                          FileAttachmentRepository fileAttachmentRepository,
                          AccessService accessService) {
        this.storagePath = Path.of(storagePath).toAbsolutePath().normalize();
        this.fileAttachmentRepository = fileAttachmentRepository;
        this.accessService = accessService;
    }

    @GetMapping("/{filename}")
    public ResponseEntity<Resource> download(@PathVariable String filename, Authentication auth) throws MalformedURLException {
        String safeName = Path.of(filename).getFileName().toString();
        var attachment = fileAttachmentRepository.findByStoragePath(safeName)
                .orElseThrow(() -> new NotFoundException("File not found"));
        var actor = accessService.getRequiredUser(auth.getName());
        if (!accessService.canAccessDocument(actor, attachment.getVersion().getDocument())) {
            throw new BusinessException("File is not accessible for current user");
        }

        Path resolved = storagePath.resolve(safeName).normalize();
        if (!resolved.startsWith(storagePath) || !Files.exists(resolved) || !Files.isReadable(resolved)) {
            throw new NotFoundException("File not found");
        }
        Resource resource = new UrlResource(resolved.toUri());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + attachment.getOriginalName() + "\"")
                .body(resource);
    }
}
