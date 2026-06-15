package com.breadbread.bakery.service;

import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.entity.BakeryImage;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BakeryImageUrlResolver {

    private final PlacesPhotoRedisService placesPhotoRedisService;

    public String resolve(BakeryImage image) {
        if (image.getImageUrl() != null) {
            return image.getImageUrl();
        }
        Bakery bakery = image.getBakery();
        if (bakery != null && bakery.getPlaceId() != null) {
            int photoIndex = Math.max(0, image.getDisplayOrder() - 1);
            return placesPhotoRedisService.getOrFetchPhotoUrl(bakery.getPlaceId(), photoIndex);
        }
        return null;
    }
}
