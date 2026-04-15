package io.github.killmeprince.docu.service;

import io.github.killmeprince.docu.dto.request.DocumentTypeRequest;
import io.github.killmeprince.docu.dto.request.UserActiveUpdateRequest;
import io.github.killmeprince.docu.dto.request.UserCreateRequest;
import io.github.killmeprince.docu.dto.response.DocumentTypeResponse;
import io.github.killmeprince.docu.dto.response.UserResponse;

import java.util.List;

public interface AdminService {
    List<UserResponse> users();
    UserResponse createUser(UserCreateRequest request);
    UserResponse updateUserActive(Long userId, UserActiveUpdateRequest request);
    List<DocumentTypeResponse> documentTypes();
    DocumentTypeResponse createType(DocumentTypeRequest request);
}
