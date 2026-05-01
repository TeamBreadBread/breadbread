package com.breadbread.global.util;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Random;

@Component
public class NicknameGenerator {

    private static final List<String> ADJECTIVES = List.of(
            "달콤한", "바삭한", "촉촉한", "고소한", "부드러운",
            "쫄깃한", "따뜻한", "신선한", "풍성한", "아삭한",
            "진한", "향긋한", "포근한", "담백한", "든든한"
    );

    private static final List<String> NOUNS = List.of(
            "크루아상", "소금빵", "바게트", "마카롱", "식빵",
            "베이글", "도넛", "브리오슈", "치아바타", "스콘",
            "머핀", "파니니", "깜빠뉴", "에클레어", "타르트"
    );

    private static final Random RANDOM = new Random();

    public String generate() {
        String adjective = ADJECTIVES.get(RANDOM.nextInt(ADJECTIVES.size()));
        String noun = NOUNS.get(RANDOM.nextInt(NOUNS.size()));
        int number = RANDOM.nextInt(9000) + 1000; // 1000~9999
        return adjective + noun + number;
    }
}
