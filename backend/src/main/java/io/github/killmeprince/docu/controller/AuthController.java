package io.github.killmeprince.docu.controller;

import io.github.killmeprince.docu.dto.request.LoginRequest;
import io.github.killmeprince.docu.dto.response.AuthResponse;
import io.github.killmeprince.docu.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody @Valid LoginRequest request) {
        return authService.login(request);
    }
}
