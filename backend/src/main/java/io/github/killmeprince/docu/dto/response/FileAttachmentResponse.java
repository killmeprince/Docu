package io.github.killmeprince.docu.dto.response;

public record FileAttachmentResponse(Long id, String originalName, Long sizeBytes, String downloadUrl) {}
