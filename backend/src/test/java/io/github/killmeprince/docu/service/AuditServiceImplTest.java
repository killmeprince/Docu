package io.github.killmeprince.docu.service;

import io.github.killmeprince.docu.dto.response.AuditEventResponse;
import io.github.killmeprince.docu.entity.AuditEvent;
import io.github.killmeprince.docu.entity.Document;
import io.github.killmeprince.docu.entity.User;
import io.github.killmeprince.docu.enums.AuditEventType;
import io.github.killmeprince.docu.enums.DocumentStatus;
import io.github.killmeprince.docu.exception.BusinessException;
import io.github.killmeprince.docu.exception.NotFoundException;
import io.github.killmeprince.docu.mapper.AuditMapper;
import io.github.killmeprince.docu.repository.AuditEventRepository;
import io.github.killmeprince.docu.repository.DocumentRepository;
import io.github.killmeprince.docu.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static io.github.killmeprince.docu.support.TestDataFactory.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuditServiceImplTest {

    @Mock private AuditEventRepository auditEventRepository;
    @Mock private DocumentRepository documentRepository;
    @Mock private UserRepository userRepository;
    @Mock private AuditMapper auditMapper;
    @Mock private AccessService accessService;

    @InjectMocks private AuditServiceImpl auditService;

    private User employee;
    private Document document;

    @BeforeEach
    void setUp() {
        employee = user(2L, "employee", "Employee User", "ROLE_EMPLOYEE");
        document = document(10L, documentType(1L, "ORDER", "Order", true), employee, DocumentStatus.DRAFT);
    }

    @Test
    void log_persistsAuditEventWithDocument() {
        when(documentRepository.findById(10L)).thenReturn(Optional.of(document));
        when(userRepository.findByUsername("employee")).thenReturn(Optional.of(employee));

        auditService.log(10L, "employee", AuditEventType.DOCUMENT_CREATED, "Created");

        ArgumentCaptor<AuditEvent> captor = ArgumentCaptor.forClass(AuditEvent.class);
        verify(auditEventRepository).save(captor.capture());
        assertEquals(document, captor.getValue().getDocument());
        assertEquals(employee, captor.getValue().getActor());
        assertEquals(AuditEventType.DOCUMENT_CREATED, captor.getValue().getType());
    }

    @Test
    void log_allowsNullDocumentId() {
        when(userRepository.findByUsername("employee")).thenReturn(Optional.of(employee));

        auditService.log(null, "employee", AuditEventType.DOCUMENT_VIEWED, "Viewed");

        ArgumentCaptor<AuditEvent> captor = ArgumentCaptor.forClass(AuditEvent.class);
        verify(auditEventRepository).save(captor.capture());
        assertNull(captor.getValue().getDocument());
    }

    @Test
    void log_throwsWhenActorMissing() {
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> auditService.log(10L, "ghost", AuditEventType.DOCUMENT_CREATED, "Created"));
    }

    @Test
    void getDocumentAudit_returnsMappedResponsesForAccessibleDocument() {
        AuditEvent event = auditEvent(1L, document, employee, AuditEventType.DOCUMENT_CREATED, "Created");
        AuditEventResponse response = auditEventResponse();
        when(accessService.getRequiredUser("employee")).thenReturn(employee);
        when(documentRepository.findById(10L)).thenReturn(Optional.of(document));
        when(accessService.canAccessDocument(employee, document)).thenReturn(true);
        when(auditEventRepository.findByDocumentIdOrderByCreatedAtDesc(10L)).thenReturn(List.of(event));
        when(auditMapper.toResponse(event)).thenReturn(response);

        List<AuditEventResponse> result = auditService.getDocumentAudit(10L, "employee");

        assertEquals(List.of(response), result);
    }

    @Test
    void getDocumentAudit_throwsWhenAccessDenied() {
        when(accessService.getRequiredUser("employee")).thenReturn(employee);
        when(documentRepository.findById(10L)).thenReturn(Optional.of(document));
        when(accessService.canAccessDocument(employee, document)).thenReturn(false);

        assertThrows(BusinessException.class, () -> auditService.getDocumentAudit(10L, "employee"));
    }
}
