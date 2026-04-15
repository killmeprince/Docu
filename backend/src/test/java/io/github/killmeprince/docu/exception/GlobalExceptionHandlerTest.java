package io.github.killmeprince.docu.exception;

import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void handleNotFound_returns404() {
        ResponseEntity<Map<String, String>> response = handler.handleNotFound(new NotFoundException("Missing"));
        assertEquals(404, response.getStatusCode().value());
        assertEquals("Missing", response.getBody().get("error"));
    }

    @Test
    void handleBusiness_returns400() {
        ResponseEntity<Map<String, String>> response = handler.handleBusiness(new BusinessException("Bad request"));
        assertEquals(400, response.getStatusCode().value());
        assertEquals("Bad request", response.getBody().get("error"));
    }

    @Test
    void handleAuthentication_returns401() {
        ResponseEntity<Map<String, String>> response = handler.handleAuthentication(new BadCredentialsException("nope"));
        assertEquals(401, response.getStatusCode().value());
        assertEquals("Authentication failed", response.getBody().get("error"));
    }
}
