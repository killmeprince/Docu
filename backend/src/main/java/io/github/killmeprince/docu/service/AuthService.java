package io.github.killmeprince.docu.service;

import io.github.killmeprince.docu.dto.request.LoginRequest;
import io.github.killmeprince.docu.dto.response.AuthResponse;

public interface AuthService {
    AuthResponse login(LoginRequest request);
}