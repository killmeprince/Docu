FROM maven:3.9.9-eclipse-temurin-17 AS build

WORKDIR /app

COPY pom.xml ./
COPY src/ src/

RUN mvn -q --no-transfer-progress -DskipTests package

FROM eclipse-temurin:17-jre

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

RUN mkdir -p /app/storage

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]