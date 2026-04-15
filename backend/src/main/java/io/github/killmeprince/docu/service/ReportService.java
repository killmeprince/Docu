package io.github.killmeprince.docu.service;

import io.github.killmeprince.docu.dto.response.ReportResponse;

public interface ReportService {
    ReportResponse summary(String username);
}
