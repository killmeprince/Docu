package io.github.killmeprince.docu.controller;

import io.github.killmeprince.docu.dto.request.DocumentTypeRequest;
import io.github.killmeprince.docu.dto.request.UserActiveUpdateRequest;
import io.github.killmeprince.docu.dto.request.UserCreateRequest;
import io.github.killmeprince.docu.service.AdminService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Set;

import static io.github.killmeprince.docu.support.TestDataFactory.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AdminControllerTest {

    @Mock private AdminService adminService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = ControllerTestSupport.mockMvc(new AdminController(adminService));
    }

    @Test
    void users_returnsUserList() throws Exception {
        when(adminService.users()).thenReturn(List.of(userResponse(10L)));

        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(10L));
    }

    @Test
    void createUser_returnsCreatedUser() throws Exception {
        when(adminService.createUser(any(UserCreateRequest.class))).thenReturn(userResponse(10L));

        mockMvc.perform(post("/api/admin/users")
                        .contentType("application/json")
                        .content(ControllerTestSupport.objectMapper().writeValueAsBytes(new UserCreateRequest("employee", "password123", "Employee User", Set.of("employee"), true))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10L));
    }

    @Test
    void updateUserActive_returnsUpdatedUser() throws Exception {
        when(adminService.updateUserActive(eq(10L), any(UserActiveUpdateRequest.class))).thenReturn(userResponse(10L));

        mockMvc.perform(patch("/api/admin/users/{id}/active", 10L)
                        .contentType("application/json")
                        .content(ControllerTestSupport.objectMapper().writeValueAsBytes(new UserActiveUpdateRequest(false))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10L));
    }

    @Test
    void types_returnsDocumentTypes() throws Exception {
        when(adminService.documentTypes()).thenReturn(List.of(documentTypeResponse(1L)));

        mockMvc.perform(get("/api/admin/document-types"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1L));
    }

    @Test
    void createType_returnsCreatedType() throws Exception {
        when(adminService.createType(any(DocumentTypeRequest.class))).thenReturn(documentTypeResponse(1L));

        mockMvc.perform(post("/api/admin/document-types")
                        .contentType("application/json")
                        .content(ControllerTestSupport.objectMapper().writeValueAsBytes(new DocumentTypeRequest("ORDER", "Order", true))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L));
    }
}
