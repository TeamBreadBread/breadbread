package com.breadbread.global.exception;

import static org.assertj.core.api.Assertions.assertThat;

import com.breadbread.global.dto.ApiResponse;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void handleTransientApiException_maps_toErrorCodeStatusAndBody() {
        TransientApiException e =
                new TransientApiException(ErrorCode.ROUTE_PROVIDER_ERROR, "재시도 소진", null);

        ResponseEntity<ApiResponse<Void>> response = handler.handleTransientApiException(e);

        assertThat(response.getStatusCode()).isEqualTo(ErrorCode.ROUTE_PROVIDER_ERROR.getStatus());
        assertThat(response.getBody().getError().getCode())
                .isEqualTo(ErrorCode.ROUTE_PROVIDER_ERROR.getCode());
    }
}
