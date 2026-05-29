package com.breadbread.bakery.client;

import com.breadbread.global.config.GooglePlacesProperties;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.Duration;
import java.util.List;
import java.util.Optional;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

@Slf4j
@Component
@RequiredArgsConstructor
public class GooglePlacesClient {

    public static final int MAX_PHOTOS = 5;
    private static final int PHOTO_MAX_WIDTH_PX = 800;

    private final WebClient webClient;
    private final GooglePlacesProperties properties;

    @Getter
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class PlacesSearchResponse {
        private List<PlaceResult> places;
    }

    @Getter
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class PlaceResult {
        private String id;
        private List<AddressComponent> addressComponents;
        private List<PlacePhoto> photos;
    }

    @Getter
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class AddressComponent {
        private String longText;
        private List<String> types;
    }

    @Getter
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class PlacePhoto {
        private String name;
    }

    @Getter
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class PhotoMediaResponse {
        private String photoUri;
    }

    /** 빵집 이름과 좌표로 Google Places Text Search를 수행하여 첫 번째 결과를 반환한다. */
    public Optional<PlaceResult> searchBakeryPlace(String name, double lat, double lng) {
        if (isApiKeyMissing()) return Optional.empty();

        var requestBodyWithBias =
                new TextSearchRequest(
                        name, new LocationBias(new Circle(new LatLng(lat, lng), 200.0)), 1);
        var requestBodyWithoutBias = new TextSearchRequestWithoutBias(name, 1);

        try {
            PlacesSearchResponse response = doSearchText(requestBodyWithBias);
            return firstPlace(response, name);
        } catch (WebClientResponseException.BadRequest e) {
            // locationBias가 데이터와 맞지 않아 400이 발생하는 케이스가 있어, 바이어스 없이 1회 재시도한다.
            log.warn(
                    "[구글 Places] 검색 400(locationBias 포함): name={}, lat={}, lng={}, body={}",
                    name,
                    lat,
                    lng,
                    e.getResponseBodyAsString());
            try {
                PlacesSearchResponse fallback = doSearchText(requestBodyWithoutBias);
                return firstPlace(fallback, name);
            } catch (WebClientResponseException ex) {
                log.error(
                        "[구글 Places] 검색 재시도 실패: name={}, status={}, body={}",
                        name,
                        ex.getStatusCode(),
                        ex.getResponseBodyAsString(),
                        ex);
                return Optional.empty();
            } catch (Exception ex) {
                log.error("[구글 Places] 검색 재시도 실패: name={}", name, ex);
                return Optional.empty();
            }
        } catch (Exception e) {
            log.error("[구글 Places] 장소 검색 실패: name={}", name, e);
            return Optional.empty();
        }
    }

    private PlacesSearchResponse doSearchText(Object requestBody) {
        return webClient
                .post()
                .uri(properties.getBaseUrl() + "/v1/places:searchText")
                .header("X-Goog-Api-Key", properties.getApiKey())
                .header("X-Goog-FieldMask", "places.id,places.addressComponents,places.photos")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(PlacesSearchResponse.class)
                .timeout(Duration.ofSeconds(10))
                .block();
    }

    private Optional<PlaceResult> firstPlace(PlacesSearchResponse response, String name) {
        if (response == null || response.getPlaces() == null || response.getPlaces().isEmpty()) {
            log.info("[구글 Places] 검색 결과 없음: name={}", name);
            return Optional.empty();
        }
        return Optional.of(response.getPlaces().get(0));
    }

    /** placeId로 Place Details를 조회해 photos 목록을 반환한다. URL 해석 시 photoName을 런타임에 획득하기 위해 사용한다. */
    public Optional<PlaceResult> getPlaceDetails(String placeId) {
        if (isApiKeyMissing()) return Optional.empty();

        try {
            PlaceResult result =
                    webClient
                            .get()
                            .uri(properties.getBaseUrl() + "/v1/places/" + placeId)
                            .header("X-Goog-Api-Key", properties.getApiKey())
                            .header("X-Goog-FieldMask", "id,photos")
                            .retrieve()
                            .bodyToMono(PlaceResult.class)
                            .timeout(Duration.ofSeconds(10))
                            .block();

            return Optional.ofNullable(result);
        } catch (Exception e) {
            log.error("[구글 Places] Place Details 조회 실패: placeId={}", placeId, e);
            return Optional.empty();
        }
    }

    /**
     * Photo 리소스명으로 실제 이미지 URL(photoUri)을 가져온다. skipHttpRedirect=true 로 JSON 응답을 받아 photoUri를 추출한다.
     */
    public Optional<String> getPhotoMediaUrl(String photoName) {
        if (isApiKeyMissing()) return Optional.empty();

        String uri =
                properties.getBaseUrl()
                        + "/v1/"
                        + photoName
                        + "/media?maxWidthPx="
                        + PHOTO_MAX_WIDTH_PX
                        + "&skipHttpRedirect=true";
        try {
            PhotoMediaResponse response =
                    webClient
                            .get()
                            .uri(uri)
                            .header("X-Goog-Api-Key", properties.getApiKey())
                            .retrieve()
                            .bodyToMono(PhotoMediaResponse.class)
                            .timeout(Duration.ofSeconds(10))
                            .block();

            return Optional.ofNullable(response).map(PhotoMediaResponse::getPhotoUri);
        } catch (Exception e) {
            log.error("[구글 Places] 사진 URL 조회 실패: photoName={}", photoName, e);
            return Optional.empty();
        }
    }

    private boolean isApiKeyMissing() {
        if (properties.getApiKey() == null || properties.getApiKey().isBlank()) {
            log.warn("[구글 Places] API 키가 설정되지 않아 요청을 건너뜁니다.");
            return true;
        }
        return false;
    }

    record TextSearchRequest(String textQuery, LocationBias locationBias, int maxResultCount) {}

    record TextSearchRequestWithoutBias(String textQuery, int maxResultCount) {}

    record LocationBias(Circle circle) {}

    record Circle(LatLng center, double radius) {}

    record LatLng(double latitude, double longitude) {}
}
