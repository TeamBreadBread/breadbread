package com.breadbread.bakery.service;

import com.breadbread.bakery.client.GooglePlacesClient;
import com.breadbread.bakery.client.GooglePlacesClient.PlacePhoto;
import com.breadbread.global.config.GooglePlacesProperties;
import java.time.Duration;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class PlacesPhotoRedisService {

    private static final String KEY_PREFIX = "places:photo:";

    private final StringRedisTemplate stringRedisTemplate;
    private final GooglePlacesClient googlePlacesClient;
    private final GooglePlacesProperties properties;

    // syncBakery에서 Text Search 응답의 photoName을 이용해 Place Details 없이 바로 캐싱
    public void warmPhotoCache(String placeId, int photoIndex, String photoName) {
        String key = KEY_PREFIX + placeId + ":" + photoIndex;
        googlePlacesClient
                .getPhotoMediaUrl(photoName)
                .ifPresent(
                        url ->
                                stringRedisTemplate
                                        .opsForValue()
                                        .set(
                                                key,
                                                url,
                                                Duration.ofSeconds(
                                                        properties.getPhotoUrlTtlSeconds())));
    }

    // Redis → Place Details(photoName) → Photo Media(photoUri) 순으로 조회
    // photoName·photoUri는 Google 정책상 DB 저장 불가, Redis TTL 캐시로만 관리
    public String getOrFetchPhotoUrl(String placeId, int photoIndex) {
        String key = KEY_PREFIX + placeId + ":" + photoIndex;

        String cached = stringRedisTemplate.opsForValue().get(key);
        if (cached != null) {
            return cached;
        }

        List<PlacePhoto> photos =
                googlePlacesClient
                        .getPlaceDetails(placeId)
                        .map(GooglePlacesClient.PlaceResult::getPhotos)
                        .orElse(null);

        if (photos == null || photoIndex >= photos.size()) {
            log.warn(
                    "[Places 캐시] 사진 인덱스 범위 초과 또는 조회 실패: placeId={}, photoIndex={}",
                    placeId,
                    photoIndex);
            return null;
        }

        String photoName = photos.get(photoIndex).getName();

        return googlePlacesClient
                .getPhotoMediaUrl(photoName)
                .map(
                        url -> {
                            stringRedisTemplate
                                    .opsForValue()
                                    .set(
                                            key,
                                            url,
                                            Duration.ofSeconds(properties.getPhotoUrlTtlSeconds()));
                            return url;
                        })
                .orElse(null);
    }
}
