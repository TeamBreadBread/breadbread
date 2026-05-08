package com.breadbread.payment.client;

import org.springframework.web.reactive.function.client.WebClient;

public record PortOneClient(WebClient http) {}
