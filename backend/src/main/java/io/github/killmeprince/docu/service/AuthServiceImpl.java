package io.github.killmeprince.docu.service;

import io.github.killmeprince.docu.dto.request.LoginRequest;
import io.github.killmeprince.docu.dto.response.AuthResponse;
import io.github.killmeprince.docu.repository.UserRepository;
import io.github.killmeprince.docu.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

import java.util.stream.Collectors;

@Service
public class AuthServiceImpl implements AuthService {
    private final AuthenticationManager authenticationManager;
    private final CustomUserDetailsService userDetailsService;
    private final JwtService jwtService;
    private final UserRepository userRepository;

    public AuthServiceImpl(AuthenticationManager authenticationManager,
                           CustomUserDetailsService userDetailsService,
                           JwtService jwtService,
                           UserRepository userRepository) {
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(request.username(), request.password()));
        var userDetails = userDetailsService.loadUserByUsername(request.username());
        var user = userRepository.findByUsername(request.username()).orElseThrow();
        return new AuthResponse(
                jwtService.generateToken(userDetails),
                userDetails.getUsername(),
                user.getFullName(),
                userDetails.getAuthorities().stream().map(a -> a.getAuthority()).collect(Collectors.toSet())
        );
    }
}
