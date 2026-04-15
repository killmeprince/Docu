package io.github.killmeprince.docu.dto.request;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record DocumentUpdateRequest(
        @NotNull Long documentTypeId,
        @NotBlank String title,
        String description,
        String changeComment
) {}