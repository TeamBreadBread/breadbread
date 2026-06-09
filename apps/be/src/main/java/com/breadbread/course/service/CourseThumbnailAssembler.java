package com.breadbread.course.service;

import com.breadbread.bakery.entity.BakeryImage;
import com.breadbread.bakery.repository.BakeryImageRepository;
import com.breadbread.bakery.service.BakeryImageUrlResolver;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CourseThumbnailAssembler {

    private final BakeryImageRepository bakeryImageRepository;
    private final BakeryImageUrlResolver bakeryImageUrlResolver;

    public Map<Long, String> buildThumbnailMap(List<Long> bakeryIds) {
        Map<Long, String> thumbnailMap = new HashMap<>();
        bakeryImageRepository
                .findAllByBakeryIdInAndDisplayOrder(bakeryIds, 1)
                .forEach(
                        (BakeryImage img) -> {
                            String url = bakeryImageUrlResolver.resolve(img);
                            if (url != null) thumbnailMap.put(img.getBakery().getId(), url);
                        });
        return thumbnailMap;
    }
}
