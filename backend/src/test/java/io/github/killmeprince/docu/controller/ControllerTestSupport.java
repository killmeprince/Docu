package io.github.killmeprince.docu.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import io.github.killmeprince.docu.exception.GlobalExceptionHandler;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

final class ControllerTestSupport {

    private ControllerTestSupport() {
    }

    static ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        return mapper;
    }

    static MockMvc mockMvc(Object controller) {
        return MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    static Authentication auth(String username) {
        return UsernamePasswordAuthenticationToken.authenticated(
                username,
                "n/a",
                java.util.List.of()
        );
    }

    static MockMultipartFile jsonPart(String name, Object payload) throws Exception {
        return new MockMultipartFile(
                name,
                "",
                "application/json",
                objectMapper().writeValueAsBytes(payload)
        );
    }
}