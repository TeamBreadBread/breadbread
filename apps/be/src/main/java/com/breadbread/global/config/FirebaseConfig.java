package com.breadbread.global.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Slf4j
@Configuration
public class FirebaseConfig {

    @Value("${spring.cloud.gcp.project-id}")
    private String projectId;

    @Value("${spring.profiles.active:local}")
    private String activeProfile;

    @PostConstruct
    public void initialize() {
        if (!FirebaseApp.getApps().isEmpty()) {
            return;
        }
        try {
            FirebaseOptions options =
                    FirebaseOptions.builder()
                            .setCredentials(GoogleCredentials.getApplicationDefault())
                            .setProjectId(projectId)
                            .build();
            FirebaseApp.initializeApp(options);
            log.info("Firebase 초기화 완료: projectId={}", projectId);
        } catch (IOException e) {
            if ("local".equals(activeProfile) || "test".equals(activeProfile)) {
                log.warn("Firebase 초기화 건너뜀 (자격증명 없음): {}", e.getMessage());
            } else {
                throw new IllegalStateException("Firebase 초기화 실패", e);
            }
        }
    }
}
