package io.github.killmeprince.docu.service;

import io.github.killmeprince.docu.entity.Document;
import io.github.killmeprince.docu.entity.DocumentType;
import io.github.killmeprince.docu.entity.User;
import io.github.killmeprince.docu.enums.DocumentStatus;
import io.github.killmeprince.docu.exception.BusinessException;
import io.github.killmeprince.docu.exception.NotFoundException;
import io.github.killmeprince.docu.repository.ApprovalStepRepository;
import io.github.killmeprince.docu.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static io.github.killmeprince.docu.support.TestDataFactory.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AccessServiceImplTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private ApprovalStepRepository approvalStepRepository;

    @InjectMocks
    private AccessServiceImpl accessService;

    private User admin;
    private User employee;
    private User approver;
    private Document document;

    @BeforeEach
    void setUp() {
        DocumentType type = documentType(1L, "ORDER", "Order", true);
        admin = user(1L, "admin", "Admin User", "ROLE_ADMIN");
        employee = user(2L, "employee", "Employee User", "ROLE_EMPLOYEE");
        approver = user(3L, "approver", "Approver User", "ROLE_APPROVER");
        document = document(10L, type, employee, DocumentStatus.DRAFT);
    }

    @Test
    void getRequiredUser_returnsExistingUser() {
        when(userRepository.findByUsername("employee")).thenReturn(Optional.of(employee));

        User result = accessService.getRequiredUser("employee");

        assertSame(employee, result);
    }

    @Test
    void getRequiredUser_throwsWhenUserMissing() {
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> accessService.getRequiredUser("ghost"));
    }

    @Test
    void requireAnyRole_allowsMatchingRole() {
        assertDoesNotThrow(() -> accessService.requireAnyRole(employee, "ROLE_EMPLOYEE", "ROLE_ADMIN"));
    }

    @Test
    void requireAnyRole_throwsForNonMatchingRole() {
        assertThrows(BusinessException.class, () -> accessService.requireAnyRole(employee, "ROLE_ADMIN"));
    }

    @Test
    void canAccessDocument_returnsTrueForAdmin() {
        assertTrue(accessService.canAccessDocument(admin, document));
        verifyNoInteractions(approvalStepRepository);
    }

    @Test
    void canAccessDocument_returnsTrueForAuthor() {
        assertTrue(accessService.canAccessDocument(employee, document));
        verifyNoInteractions(approvalStepRepository);
    }

    @Test
    void canAccessDocument_checksApprovalAssignment() {
        when(approvalStepRepository.existsByDocumentIdAndApproverUsername(10L, "approver")).thenReturn(true);

        assertTrue(accessService.canAccessDocument(approver, document));
    }

    @Test
    void canCreateDocuments_allowsAdminAndEmployeeOnly() {
        assertTrue(accessService.canCreateDocuments(admin));
        assertTrue(accessService.canCreateDocuments(employee));
        assertFalse(accessService.canCreateDocuments(approver));
    }

    @Test
    void canViewReports_allowsAdminAndApproverOnly() {
        assertTrue(accessService.canViewReports(admin));
        assertTrue(accessService.canViewReports(approver));
        assertFalse(accessService.canViewReports(employee));
    }
}
