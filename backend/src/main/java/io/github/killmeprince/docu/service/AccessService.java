package io.github.killmeprince.docu.service;

import io.github.killmeprince.docu.entity.Document;
import io.github.killmeprince.docu.entity.User;

public interface AccessService {
    User getRequiredUser(String username);
    boolean hasRole(User user, String roleName);
    void requireAnyRole(User user, String... roleNames);
    boolean canAccessDocument(User user, Document document);
    boolean canCreateDocuments(User user);
    boolean canViewReports(User user);
}
