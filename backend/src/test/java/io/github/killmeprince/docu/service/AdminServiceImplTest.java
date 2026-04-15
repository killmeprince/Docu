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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static io.github.killmeprince.docu.support.TestDataFactory.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private DocumentTypeRepository documentTypeRepository;
    @Mock private PasswordEncoder passwordEncoder;

    @InjectMocks private AdminServiceImpl adminService;

    private Role employeeRole;
    private Role approverRole;

    @BeforeEach
    void setUp() {
        employeeRole = role("ROLE_EMPLOYEE");
        approverRole = role("ROLE_APPROVER");
    }

    @Test
    void users_returnsMappedResponses() {
        when(userRepository.findAll()).thenReturn(List.of(user(1L, "employee", "Employee User", "ROLE_EMPLOYEE")));

        List<UserResponse> result = adminService.users();

        assertEquals(1, result.size());
        assertEquals("employee", result.get(0).username());
    }

    @Test
    void createUser_normalizesRolesAndEncodesPassword() {
        UserCreateRequest request = new UserCreateRequest("employee", "password123", "Employee User", Set.of("employee", "ROLE_APPROVER"), true);
        when(userRepository.existsByUsernameIgnoreCase("employee")).thenReturn(false);
        when(roleRepository.findByName("ROLE_EMPLOYEE")).thenReturn(Optional.of(employeeRole));
        when(roleRepository.findByName("ROLE_APPROVER")).thenReturn(Optional.of(approverRole));
        when(passwordEncoder.encode("password123")).thenReturn("encoded-password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User saved = invocation.getArgument(0);
            saved.setId(99L);
            return saved;
        });

        UserResponse result = adminService.createUser(request);

        assertEquals(99L, result.id());
        assertTrue(result.roles().contains("ROLE_EMPLOYEE"));
        assertTrue(result.roles().contains("ROLE_APPROVER"));

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertEquals("encoded-password", captor.getValue().getPasswordHash());
    }

    @Test
    void createUser_throwsForDuplicateUsername() {
        UserCreateRequest request = new UserCreateRequest("employee", "password123", "Employee User", Set.of("employee"), true);
        when(userRepository.existsByUsernameIgnoreCase("employee")).thenReturn(true);

        assertThrows(BusinessException.class, () -> adminService.createUser(request));
        verifyNoInteractions(roleRepository, passwordEncoder);
    }

    @Test
    void createUser_throwsForUnknownRole() {
        UserCreateRequest request = new UserCreateRequest("employee", "password123", "Employee User", Set.of("unknown"), true);
        when(userRepository.existsByUsernameIgnoreCase("employee")).thenReturn(false);
        when(roleRepository.findByName("ROLE_UNKNOWN")).thenReturn(Optional.empty());

        assertThrows(BusinessException.class, () -> adminService.createUser(request));
    }

    @Test
    void updateUserActive_updatesFlag() {
        User existing = user(10L, "employee", "Employee User", "ROLE_EMPLOYEE");
        when(userRepository.findById(10L)).thenReturn(Optional.of(existing));
        when(userRepository.save(existing)).thenReturn(existing);

        UserResponse result = adminService.updateUserActive(10L, new UserActiveUpdateRequest(false));

        assertFalse(existing.isActive());
        assertFalse(result.active());
    }

    @Test
    void updateUserActive_throwsWhenMissing() {
        when(userRepository.findById(10L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> adminService.updateUserActive(10L, new UserActiveUpdateRequest(false)));
    }

    @Test
    void documentTypes_returnsMappedResponses() {
        when(documentTypeRepository.findAll()).thenReturn(List.of(documentType(1L, "ORDER", "Order", true)));

        List<DocumentTypeResponse> result = adminService.documentTypes();

        assertEquals(1, result.size());
        assertEquals("ORDER", result.get(0).code());
    }

    @Test
    void createType_savesTrimmedType() {
        when(documentTypeRepository.existsByCodeIgnoreCase(" ORDER ")).thenReturn(false);
        when(documentTypeRepository.save(any(DocumentType.class))).thenAnswer(invocation -> {
            DocumentType saved = invocation.getArgument(0);
            saved.setId(5L);
            return saved;
        });

        DocumentTypeResponse result = adminService.createType(new DocumentTypeRequest(" ORDER ", " Order ", true));

        assertEquals(5L, result.id());
        assertEquals("ORDER", result.code());
        assertEquals("Order", result.name());
    }

    @Test
    void createType_throwsForDuplicateCode() {
        when(documentTypeRepository.existsByCodeIgnoreCase("ORDER")).thenReturn(true);

        assertThrows(BusinessException.class, () -> adminService.createType(new DocumentTypeRequest("ORDER", "Order", true)));
    }
}
