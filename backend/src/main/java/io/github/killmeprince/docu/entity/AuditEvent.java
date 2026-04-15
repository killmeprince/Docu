package io.github.killmeprince.docu.entity;

import io.github.killmeprince.docu.enums.AuditEventType;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "audit_events")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuditEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "document_id")
    private Document document;

    @ManyToOne(optional = false)
    @JoinColumn(name = "actor_id")
    private User actor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AuditEventType type;

    @Column(nullable = false, columnDefinition = "text")
    private String details;

    @Column(nullable = false)
    private OffsetDateTime createdAt;
}
