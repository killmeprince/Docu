package io.github.killmeprince.docu.controller;

import io.github.killmeprince.docu.dto.request.DocumentTypeRequest;
import io.github.killmeprince.docu.dto.request.UserActiveUpdateRequest;
import io.github.killmeprince.docu.dto.request.UserCreateRequest;
import io.github.killmeprince.docu.dto.response.DocumentTypeResponse;
import io.github.killmeprince.docu.dto.response.UserResponse;
import io.github.killmeprince.docu.service.AdminService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminController {
    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/users")
    public List<UserResponse> users() {
        return adminService.users();
    }

    @PostMapping("/users")
    public UserResponse createUser(@RequestBody @Valid UserCreateRequest request) {
        return adminService.createUser(request);
    }

    @PatchMapping("/users/{id}/active")
    public UserResponse updateUserActive(@PathVariable Long id, @RequestBody UserActiveUpdateRequest request) {
        return adminService.updateUserActive(id, request);
    }

    @GetMapping("/document-types")
    public List<DocumentTypeResponse> types() {
        return adminService.documentTypes();
    }

    @PostMapping("/document-types")
    public DocumentTypeResponse createType(@RequestBody @Valid DocumentTypeRequest request) {
        return adminService.createType(request);
    }
}
