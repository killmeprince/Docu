package io.github.killmeprince.docu.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "file_attachments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FileAttachment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "version_id")
    private DocumentVersion version;

    @Column(nullable = false)
    private String originalName;

    @Column(nullable = false)
    private String storagePath;

    @Column(nullable = false)
    private Long sizeBytes;
}

