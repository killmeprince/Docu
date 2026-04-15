package io.github.killmeprince.docu.dto.request;

import jakarta.validation.constraints.NotBlank;

public record DocumentTypeRequest(@NotBlank String code, @NotBlank String name, boolean active) {}
