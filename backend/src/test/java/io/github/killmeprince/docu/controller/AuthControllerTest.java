package io.github.killmeprince.docu.controller;

import io.github.killmeprince.docu.dto.request.LoginRequest;
import io.github.killmeprince.docu.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Set;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock private AuthService authService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = ControllerTestSupport.mockMvc(new AuthController(authService));
    }

    @Test
    void login_returnsAuthResponse() throws Exception {
        when(authService.login(any(LoginRequest.class))).thenReturn(new io.github.killmeprince.docu.dto.response.AuthResponse("jwt", "employee", "Employee User", java.util.Set.of("ROLE_EMPLOYEE")));

        mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content(ControllerTestSupport.objectMapper().writeValueAsBytes(new LoginRequest("employee", "password123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt"))
                .andExpect(jsonPath("$.username").value("employee"));
    }


}
