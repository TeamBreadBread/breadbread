package com.breadbread;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class BreadbreadApplication {

	public static void main(String[] args) {
		SpringApplication.run(BreadbreadApplication.class, args);
	}

}
