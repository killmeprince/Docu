package io.github.killmeprince.docu.service;

import io.github.killmeprince.docu.entity.Document;
import io.github.killmeprince.docu.entity.User;
import io.github.killmeprince.docu.exception.BusinessException;
import io.github.killmeprince.docu.exception.NotFoundException;
import io.github.killmeprince.docu.repository.ApprovalStepRepository;
import io.github.killmeprince.docu.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class AccessServiceImpl implements AccessService {
    private static final String ROLE_ADMIN = "ROLE_ADMIN";
    private static final String ROLE_EMPLOYEE = "ROLE_EMPLOYEE";
    private static final String ROLE_APPROVER = "ROLE_APPROVER";

    private final UserRepository userRepository;
    private final ApprovalStepRepository approvalStepRepository;

    public AccessServiceImpl(UserRepository userRepository, ApprovalStepRepository approvalStepRepository) {
        this.userRepository = userRepository;
        this.approvalStepRepository = approvalStepRepository;
    }

    @Override
    public User getRequiredUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    @Override
    public boolean hasRole(User user, String roleName) {
        return user.getRoles().stream().anyMatch(role -> roleName.equals(role.getName()));
    }

    @Override
    public void requireAnyRole(User user, String... roleNames) {
        for (String roleName : roleNames) {
            if (hasRole(user, roleName)) {
                return;
            }
        }
        throw new BusinessException("Operation is not allowed for current user role");
    }

    @Override
    public boolean canAccessDocument(User user, Document document) {
        if (hasRole(user, ROLE_ADMIN)) {
            return true;
        }
        if (document.getAuthor().getId().equals(user.getId())) {
            return true;
        }
        return approvalStepRepository.existsByDocumentIdAndApproverUsername(document.getId(), user.getUsername());
    }

    @Override
    public boolean canCreateDocuments(User user) {
        return hasRole(user, ROLE_ADMIN) || hasRole(user, ROLE_EMPLOYEE);
    }

    @Override
    public boolean canViewReports(User user) {
        return hasRole(user, ROLE_ADMIN) || hasRole(user, ROLE_APPROVER);
    }
}
