package io.github.killmeprince.docu.dto.response;

import java.util.Set;

public record UserResponse(Long id, String username, String fullName, boolean active, Set<String> roles) {}
