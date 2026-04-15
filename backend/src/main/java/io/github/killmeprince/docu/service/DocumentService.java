package io.github.killmeprince.docu.service;

import io.github.killmeprince.docu.dto.request.DocumentCreateRequest;
import io.github.killmeprince.docu.dto.request.DocumentUpdateRequest;
import io.github.killmeprince.docu.dto.response.DocumentDetailsResponse;
import io.github.killmeprince.docu.dto.response.DocumentResponse;
import io.github.killmeprince.docu.dto.response.DocumentVersionResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface DocumentService {
    DocumentResponse create(DocumentCreateRequest request, MultipartFile file, String username);
    DocumentResponse update(Long id, DocumentUpdateRequest request, MultipartFile file, String username);
    List<DocumentResponse> search(String regNumber, Long typeId, String author, String status, String username);
    DocumentDetailsResponse getById(Long id, String username);
    List<DocumentVersionResponse> getVersions(Long id, String username);
    void sendToApproval(Long id, String username);
}
