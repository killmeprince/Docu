package io.github.killmeprince.docu.service;

import io.github.killmeprince.docu.dto.request.DocumentTypeRequest;
import io.github.killmeprince.docu.dto.request.UserActiveUpdateRequest;
import io.github.killmeprince.docu.dto.request.UserCreateRequest;
import io.github.killmeprince.docu.dto.response.DocumentTypeResponse;
import io.github.killmeprince.docu.dto.response.UserResponse;
import io.github.killmeprince.docu.entity.DocumentType;
import io.github.killmeprince.docu.entity.Role;
import io.github.killmeprince.docu.entity.User;
import io.github.killmeprince.docu.exception.BusinessException;
import io.github.killmeprince.docu.exception.NotFoundException;
import io.github.killmeprince.docu.repository.DocumentTypeRepository;
import io.github.killmeprince.docu.repository.RoleRepository;
import io.github.killmeprince.docu.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AdminServiceImpl implements AdminService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final DocumentTypeRepository documentTypeRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminServiceImpl(UserRepository userRepository,
                            RoleRepository roleRepository,
                            DocumentTypeRepository documentTypeRepository,
                            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.documentTypeRepository = documentTypeRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public List<UserResponse> users() {
        return userRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    public UserResponse createUser(UserCreateRequest request) {
        if (userRepository.existsByUsernameIgnoreCase(request.username())) {
            throw new BusinessException("User with this username already exists");
        }
        Set<Role> roles = request.roles().stream()
                .map(roleName -> normalizeRole(roleName))
                .map(this::getRequiredRole)
                .collect(Collectors.toSet());
        User user = User.builder()
                .username(request.username().trim())
                .passwordHash(passwordEncoder.encode(request.password()))
                .fullName(request.fullName().trim())
                .active(request.active())
                .roles(roles)
                .build();
        return toResponse(userRepository.save(user));
    }

    @Override
    public UserResponse updateUserActive(Long userId, UserActiveUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
        user.setActive(request.active());
        return toResponse(userRepository.save(user));
    }

    @Override
    public List<DocumentTypeResponse> documentTypes() {
        return documentTypeRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public DocumentTypeResponse createType(DocumentTypeRequest request) {
        if (documentTypeRepository.existsByCodeIgnoreCase(request.code())) {
            throw new BusinessException("Document type with this code already exists");
        }
        DocumentType type = documentTypeRepository.save(DocumentType.builder()
                .code(request.code().trim())
                .name(request.name().trim())
                .active(request.active())
                .build());
        return toResponse(type);
    }

    private Role getRequiredRole(String roleName) {
        return roleRepository.findByName(roleName)
                .orElseThrow(() -> new BusinessException("Unknown role: " + roleName));
    }

    private String normalizeRole(String roleName) {
        String normalized = roleName.trim().toUpperCase(Locale.ROOT);
        return normalized.startsWith("ROLE_") ? normalized : "ROLE_" + normalized;
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                user.isActive(),
                user.getRoles().stream().map(Role::getName).collect(Collectors.toSet())
        );
    }

    private DocumentTypeResponse toResponse(DocumentType type) {
        return new DocumentTypeResponse(type.getId(), type.getCode(), type.getName(), type.isActive());
    }
}
