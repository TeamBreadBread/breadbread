package com.breadbread;

import com.google.cloud.storage.Storage;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@ActiveProfiles("test")
@SpringBootTest(properties = "spring.cloud.gcp.sql.enabled=false")
class BreadbreadApplicationTests {

	@MockitoBean
	Storage storage;

	@Test
	void contextLoads() {
	}

}
