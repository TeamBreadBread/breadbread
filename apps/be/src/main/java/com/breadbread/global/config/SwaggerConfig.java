package com.breadbread.global.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {
    @Bean
    public OpenAPI openAPI() {
        SecurityScheme bearerScheme =
                new SecurityScheme()
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT")
                        .in(SecurityScheme.In.HEADER)
                        .name("Authorization");

        SecurityScheme apiKeyScheme =
                new SecurityScheme()
                        .type(SecurityScheme.Type.APIKEY)
                        .in(SecurityScheme.In.HEADER)
                        .name("X-AI-API-KEY");

        SecurityRequirement securityRequirement =
                new SecurityRequirement().addList("BearerAuth").addList("ApiKeyAuth");

        return new OpenAPI()
                .info(
                        new Info()
                                .title("BreadBread 백엔드 API 명세서")
                                .description("BreadBread 백엔드 API 명세서")
                                .version("1.0.0"))
                .addSecurityItem(securityRequirement)
                .schemaRequirement("BearerAuth", bearerScheme)
                .schemaRequirement("ApiKeyAuth", apiKeyScheme);
    }
}
