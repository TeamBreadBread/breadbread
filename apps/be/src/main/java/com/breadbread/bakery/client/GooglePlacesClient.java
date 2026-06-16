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
        private DisplayName displayName;
        private String formattedAddress;
        private Location location;
        private String nationalPhoneNumber;
        private List<AddressComponent> addressComponents;
        private List<PlacePhoto> photos;
        private RegularOpeningHours regularOpeningHours;
        private String googleMapsUri;
    }

    @Getter
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class DisplayName {
        private String text;
        private String languageCode;
    }

    @Getter
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class RegularOpeningHours {
        private List<OpeningPeriod> periods;
    }

    @Getter
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Location {
        private double latitude;
        private double longitude;
    }

    @Getter
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class OpeningPeriod {
        private PeriodDetail open;
        private PeriodDetail close;
    }

    @Getter
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class PeriodDetail {
        private int day; // 0=Sunday, 1=Monday, ...
        private int hour;
        private int minute;
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

    /** 키워드(지역 등) + bakery 타입으로 빵집 목록을 검색한다. */
    public List<PlaceResult> searchBakeriesByKeyword(String keyword) {
        if (isApiKeyMissing()) return List.of();

        var requestBody = new TextSearchWithTypeRequest(keyword, "bakery", true, 20, "ko");
        try {
            PlacesSearchResponse response = doSearchTextWithDetails(requestBody);
            if (response == null || response.getPlaces() == null) return List.of();
            return response.getPlaces();
        } catch (Exception e) {
            log.error("[구글 Places] 키워드 검색 실패: keyword={}", keyword, e);
            return List.of();
        }
    }

    /** 빵집 이름과 좌표로 Google Places Text Search를 수행하여 후보 목록을 반환한다. */
    public List<PlaceResult> searchBakeryPlace(String name, double lat, double lng) {
        if (isApiKeyMissing()) return List.of();

        var requestBodyWithBias =
                new TextSearchRequest(
                        name, new LocationBias(new Circle(new LatLng(lat, lng), 200.0)), 5, "ko");
        var requestBodyWithoutBias = new TextSearchRequestWithoutBias(name, 5, "ko");

        try {
            PlacesSearchResponse response = doSearchText(requestBodyWithBias);
            return placesOrEmpty(response, name);
        } catch (WebClientResponseException.BadRequest e) {
            // locationBias가 데이터와 맞지 않아 400이 발생하는 케이스가 있어, 바이어스 없이 1회 재시도한다.
            log.warn(
                    "[구글 Places] 검색 400(locationBias 포함), bias 제거 후 재시도: name={}, lat={}, lng={}",
                    name,
                    lat,
                    lng);
            try {
                PlacesSearchResponse fallback = doSearchText(requestBodyWithoutBias);
                return placesOrEmpty(fallback, name);
            } catch (WebClientResponseException ex) {
                log.error(
                        "[구글 Places] 검색 재시도 실패: name={}, status={}", name, ex.getStatusCode(), ex);
                return List.of();
            } catch (Exception ex) {
                log.error("[구글 Places] 검색 재시도 실패: name={}", name, ex);
                return List.of();
            }
        } catch (Exception e) {
            log.error("[구글 Places] 장소 검색 실패: name={}", name, e);
            return List.of();
        }
    }

    private PlacesSearchResponse doSearchText(Object requestBody) {
        return webClient
                .post()
                .uri(properties.getBaseUrl() + "/v1/places:searchText")
                .header("X-Goog-Api-Key", properties.getApiKey())
                .header(
                        "X-Goog-FieldMask",
                        "places.id,places.location,places.addressComponents,places.photos")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(PlacesSearchResponse.class)
                .timeout(Duration.ofSeconds(10))
                .block();
    }

    private PlacesSearchResponse doSearchTextWithDetails(Object requestBody) {
        return webClient
                .post()
                .uri(properties.getBaseUrl() + "/v1/places:searchText")
                .header("X-Goog-Api-Key", properties.getApiKey())
                .header(
                        "X-Goog-FieldMask",
                        "places.id,places.displayName,places.formattedAddress,places.location,places.nationalPhoneNumber,places.addressComponents,places.photos,places.regularOpeningHours,places.googleMapsUri")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(PlacesSearchResponse.class)
                .timeout(Duration.ofSeconds(10))
                .block();
    }

    private List<PlaceResult> placesOrEmpty(PlacesSearchResponse response, String name) {
        if (response == null || response.getPlaces() == null || response.getPlaces().isEmpty()) {
            log.info("[구글 Places] 검색 결과 없음: name={}", name);
            return List.of();
        }
        return response.getPlaces();
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

    record TextSearchRequest(
            String textQuery, LocationBias locationBias, int maxResultCount, String languageCode) {}

    record TextSearchRequestWithoutBias(
            String textQuery, int maxResultCount, String languageCode) {}

    record TextSearchWithTypeRequest(
            String textQuery,
            String includedType,
            boolean strictTypeFiltering,
            int maxResultCount,
            String languageCode) {}

    record LocationBias(Circle circle) {}

    record Circle(LatLng center, double radius) {}

    record LatLng(double latitude, double longitude) {}
}
