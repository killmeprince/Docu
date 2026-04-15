package io.github.killmeprince.docu.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "approval_route_templates")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ApprovalRouteTemplate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "document_type_id")
    private DocumentType documentType;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private boolean active;
}
