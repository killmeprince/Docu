package io.github.killmeprince.docu.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record DocumentCreateRequest(
        @NotNull Long documentTypeId,
        @NotBlank String registrationNumber,
        @NotBlank String title,
        String description,
        String changeComment
) {}
