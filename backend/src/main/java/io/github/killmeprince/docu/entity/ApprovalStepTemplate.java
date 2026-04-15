package io.github.killmeprince.docu.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "approval_step_templates")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ApprovalStepTemplate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "route_template_id")
    private ApprovalRouteTemplate routeTemplate;

    @ManyToOne(optional = false)
    @JoinColumn(name = "approver_id")
    private User approver;

    @Column(nullable = false)
    private Integer stepOrder;
}
