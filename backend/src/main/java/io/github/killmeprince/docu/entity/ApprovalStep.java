package io.github.killmeprince.docu.entity;

import io.github.killmeprince.docu.enums.ApprovalStepStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "approval_steps")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ApprovalStep {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "document_id")
    private Document document;

    @ManyToOne(optional = false)
    @JoinColumn(name = "approver_id")
    private User approver;

    @Column(nullable = false)
    private Integer stepOrder;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ApprovalStepStatus status;

    private String comment;

    private OffsetDateTime decidedAt;
}
