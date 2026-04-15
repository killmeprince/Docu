package io.github.killmeprince.docu.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "document_versions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DocumentVersion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "document_id")
    private Document document;

    @Column(nullable = false)
    private Integer versionNumber;

    @Column(nullable = false)
    private String changeComment;

    @Column(nullable = false)
    private OffsetDateTime createdAt;
}

