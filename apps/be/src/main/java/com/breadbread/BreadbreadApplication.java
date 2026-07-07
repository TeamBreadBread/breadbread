package com.breadbread;

import net.javacrumbs.shedlock.spring.annotation.EnableSchedulerLock;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.retry.annotation.EnableRetry;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableJpaAuditing
@EnableScheduling
@EnableRetry
@EnableSchedulerLock(defaultLockAtMostFor = "PT10M")
public class BreadbreadApplication {

    public static void main(String[] args) {
        SpringApplication.run(BreadbreadApplication.class, args);
    }
}
