package io.github.killmeprince.docu.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.MockMvcPrint;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletionService;
import java.util.concurrent.ExecutorCompletionService;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.locks.LockSupport;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

@SpringBootTest
@AutoConfigureMockMvc(print = MockMvcPrint.NONE, printOnlyOnFailure = false)
@ActiveProfiles("test")
@Tag("load")
class ReportSummaryLoadIntegrationTest {

    private static final int TARGET_RPS = 170;
    private static final int MIN_ACCEPTABLE_RPS = 150;
    private static final int TEST_DURATION_SECONDS = 8;
    private static final int WORKERS = 32;
    private static final int WARM_UP_REQUESTS = 40;

    private static final String REPORT_USERNAME = "admin";
    private static final String REPORT_PASSWORD = "password123";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void reportsSummary_shouldSustainTargetThroughput_withoutErrors() throws Exception {
        String jwt = loginAndGetJwt();
        warmUp(jwt);

        final int totalRequests = TARGET_RPS * TEST_DURATION_SECONDS;
        final long intervalNanos = TimeUnit.SECONDS.toNanos(1) / TARGET_RPS;

        ExecutorService pool = Executors.newFixedThreadPool(WORKERS);
        CompletionService<Long> completion = new ExecutorCompletionService<>(pool);

        AtomicInteger successCount = new AtomicInteger();
        AtomicInteger errorCount = new AtomicInteger();

        long startedAt = System.nanoTime();

        try {
            for (int i = 0; i < totalRequests; i++) {
                final long plannedStart = startedAt + (i * intervalNanos);

                completion.submit(() -> {
                    long waitNanos = plannedStart - System.nanoTime();
                    if (waitNanos > 0) {
                        LockSupport.parkNanos(waitNanos);
                    }

                    long requestStartedAt = System.nanoTime();

                    int status = mockMvc.perform(get("/api/reports/summary")
                                    .header(HttpHeaders.AUTHORIZATION, bearer(jwt)))
                            .andReturn()
                            .getResponse()
                            .getStatus();

                    long latencyNanos = System.nanoTime() - requestStartedAt;

                    if (status == 200) {
                        successCount.incrementAndGet();
                    } else {
                        errorCount.incrementAndGet();
                    }

                    return latencyNanos;
                });
            }

            List<Long> latenciesNanos = new ArrayList<>(totalRequests);
            for (int i = 0; i < totalRequests; i++) {
                Future<Long> result = completion.take();
                latenciesNanos.add(result.get(30, TimeUnit.SECONDS));
            }

            long elapsedNanos = System.nanoTime() - startedAt;
            double achievedRps = totalRequests / (elapsedNanos / 1_000_000_000.0);

            latenciesNanos.sort(Long::compareTo);
            long p95Nanos = latenciesNanos.get((int) Math.ceil(latenciesNanos.size() * 0.95) - 1);
            double p95Millis = p95Nanos / 1_000_000.0;

            System.out.printf(
                    "Report summary load test completed: success=%d, errors=%d, achievedRps=%.2f, p95=%.2f ms%n",
                    successCount.get(),
                    errorCount.get(),
                    achievedRps,
                    p95Millis
            );

            assertTrue(errorCount.get() == 0,
                    () -> "Load test returned non-200 responses: " + errorCount.get());

            assertTrue(successCount.get() == totalRequests,
                    () -> "Expected successful responses: " + totalRequests + ", got: " + successCount.get());

            assertTrue(achievedRps >= MIN_ACCEPTABLE_RPS,
                    () -> "RPS is below acceptable threshold. Achieved: " + achievedRps);
        } finally {
            pool.shutdownNow();
            assertTrue(pool.awaitTermination(10, TimeUnit.SECONDS),
                    "Executor did not terminate in time");
        }
    }

    private void warmUp(String jwt) throws Exception {
        for (int i = 0; i < WARM_UP_REQUESTS; i++) {
            int status = mockMvc.perform(get("/api/reports/summary")
                            .header(HttpHeaders.AUTHORIZATION, bearer(jwt)))
                    .andReturn()
                    .getResponse()
                    .getStatus();

            assertTrue(status == 200, () -> "Warm-up request failed with status: " + status);
        }
    }

    private String loginAndGetJwt() throws Exception {
        String responseBody = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "%s",
                                  "password": "%s"
                                }
                                """.formatted(REPORT_USERNAME, REPORT_PASSWORD)))
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode json = objectMapper.readTree(responseBody);

        String token = extractToken(json);
        assertFalse(token == null || token.isBlank(),
                "JWT token was not found in login response");

        return token;
    }

    private String extractToken(JsonNode json) {
        if (json.hasNonNull("token")) {
            return json.get("token").asText();
        }
        if (json.hasNonNull("accessToken")) {
            return json.get("accessToken").asText();
        }
        if (json.hasNonNull("jwt")) {
            return json.get("jwt").asText();
        }
        return null;
    }

    private String bearer(String jwt) {
        return "Bearer " + jwt;
    }
}