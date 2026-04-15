package io.github.killmeprince.docu.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "document_types")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DocumentType {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private boolean active;
}

