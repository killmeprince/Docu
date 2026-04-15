package io.github.killmeprince.docu.controller;

import io.github.killmeprince.docu.dto.response.ReportResponse;
import io.github.killmeprince.docu.service.ReportService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
public class ReportController {
    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/summary")
    public ReportResponse summary(Authentication auth) {
        return reportService.summary(auth.getName());
    }
}
