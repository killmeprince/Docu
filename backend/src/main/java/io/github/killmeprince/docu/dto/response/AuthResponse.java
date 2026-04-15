package io.github.killmeprince.docu.dto.response;

import java.util.Set;

public record AuthResponse(String token, String username, String fullName, Set<String> roles) {}
