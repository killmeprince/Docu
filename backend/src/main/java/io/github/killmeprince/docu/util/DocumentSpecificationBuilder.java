package io.github.killmeprince.docu.util;

import io.github.killmeprince.docu.entity.Document;
import io.github.killmeprince.docu.enums.DocumentStatus;
import org.springframework.data.jpa.domain.Specification;

public final class DocumentSpecificationBuilder {

    private DocumentSpecificationBuilder() {
    }

    public static Specification<Document> build(String regNumber, Long typeId, String author, String status) {
        Specification<Document> specification = alwaysTrue();

        if (!isBlank(regNumber)) {
            specification = specification.and(hasRegNumber(regNumber));
        }
        if (typeId != null) {
            specification = specification.and(hasType(typeId));
        }
        if (!isBlank(author)) {
            specification = specification.and(hasAuthor(author));
        }

        Specification<Document> statusSpecification = hasStatus(status);
        if (statusSpecification != null) {
            specification = specification.and(statusSpecification);
        }

        return specification;
    }

    private static Specification<Document> alwaysTrue() {
        return (root, query, cb) -> cb.conjunction();
    }

    private static Specification<Document> hasRegNumber(String regNumber) {
        String normalized = regNumber.trim().toLowerCase();
        return (root, query, cb) ->
                cb.like(cb.lower(root.get("registrationNumber")), "%" + normalized + "%");
    }

    private static Specification<Document> hasType(Long typeId) {
        return (root, query, cb) ->
                cb.equal(root.get("documentType").get("id"), typeId);
    }

    private static Specification<Document> hasAuthor(String author) {
        String normalized = author.trim().toLowerCase();
        return (root, query, cb) ->
                cb.like(cb.lower(root.get("author").get("username")), "%" + normalized + "%");
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