package io.github.killmeprince.docu.util;

import io.github.killmeprince.docu.entity.Document;
import io.github.killmeprince.docu.enums.DocumentStatus;
import org.springframework.data.jpa.domain.Specification;

public final class DocumentSpecificationBuilder {
    private DocumentSpecificationBuilder() {
    }

    public static Specification<Document> build(String regNumber, Long typeId, String author, String status) {
        return Specification.where(hasRegNumber(regNumber))
                .and(hasType(typeId))
                .and(hasAuthor(author))
                .and(hasStatus(status));
    }

    private static Specification<Document> hasRegNumber(String regNumber) {
        return (root, query, cb) -> isBlank(regNumber)
                ? null
                : cb.like(cb.lower(root.get("registrationNumber")), "%" + regNumber.trim().toLowerCase() + "%");
    }

    private static Specification<Document> hasType(Long typeId) {
        return (root, query, cb) -> typeId == null ? null : cb.equal(root.get("documentType").get("id"), typeId);
    }

    private static Specification<Document> hasAuthor(String author) {
        return (root, query, cb) -> isBlank(author)
                ? null
                : cb.like(cb.lower(root.get("author").get("username")), "%" + author.trim().toLowerCase() + "%");
    }

    private static Specification<Document> hasStatus(String status) {
        if (isBlank(status)) {
            return null;
        }
        DocumentStatus parsedStatus;
        try {
            parsedStatus = DocumentStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return (root, query, cb) -> cb.disjunction();
        }
        return (root, query, cb) -> cb.equal(root.get("status"), parsedStatus);
    }

    private static boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
