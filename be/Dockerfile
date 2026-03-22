# 1. 빌드 환경
FROM eclipse-temurin:17-jdk-jammy AS build
WORKDIR /app

# 빌드에 필요한 파일들 복사
COPY be/gradlew .
COPY be/gradlew.bat .
COPY be/gradle gradle
COPY be/build.gradle .
COPY be/settings.gradle .
COPY be/src src

# 실행 권한 부여 및 빌드
RUN chmod +x ./gradlew
RUN ./gradlew bootJar -x test

# 2. 실행 환경
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# 빌드 단계에서 생성된 jar 파일만 복사
COPY --from=build /app/build/libs/*.jar app.jar

# Cloud Run 기본 포트
EXPOSE 8080

# 애플리케이션 실행
ENTRYPOINT ["java", "-jar", "app.jar"]