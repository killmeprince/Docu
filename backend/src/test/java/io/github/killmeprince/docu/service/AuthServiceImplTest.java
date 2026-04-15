package io.github.killmeprince.docu.service;

import io.github.killmeprince.docu.dto.request.LoginRequest;
import io.github.killmeprince.docu.dto.response.AuthResponse;
import io.github.killmeprince.docu.repository.UserRepository;
import io.github.killmeprince.docu.security.JwtService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Optional;

import static io.github.killmeprince.docu.support.TestDataFactory.user;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock private AuthenticationManager authenticationManager;
    @Mock private CustomUserDetailsService userDetailsService;
    @Mock private JwtService jwtService;
    @Mock private UserRepository userRepository;

    @InjectMocks private AuthServiceImpl authService;

    @Test
    void login_authenticatesAndBuildsResponse() {
        LoginRequest request = new LoginRequest("employee", "password123");
        UserDetails userDetails = User.withUsername("employee").password("encoded").authorities("ROLE_EMPLOYEE").build();
        io.github.killmeprince.docu.entity.User user = user(10L, "employee", "Employee User", "ROLE_EMPLOYEE");
        when(userDetailsService.loadUserByUsername("employee")).thenReturn(userDetails);
        when(jwtService.generateToken(userDetails)).thenReturn("jwt-token");
        when(userRepository.findByUsername("employee")).thenReturn(Optional.of(user));

        AuthResponse response = authService.login(request);

        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        assertEquals("jwt-token", response.token());
        assertEquals("Employee User", response.fullName());
        assertTrue(response.roles().contains("ROLE_EMPLOYEE"));
    }
}
