package io.github.killmeprince.docu.config;


import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DotEnvConfig {
    static {
        try {
            Dotenv dotenv = Dotenv.configure()
                    .ignoreIfMissing()
                    .filename(".env")
                    .load();

            dotenv.entries().forEach(entry -> {
                String k = entry.getKey();
                String v = entry.getValue();

                if (System.getProperty(k) != null) return;
                if (System.getenv(k) != null) return;

                System.setProperty(k, v);
            });
        } catch (Exception e) {
            System.out.println("Dotenv load skipped");
        }
    }
}
