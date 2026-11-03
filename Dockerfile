# Imagen de Kasero: compila Angular, empaqueta Spring Boot y ejecuta el JAR.
# Variables necesarias al ejecutar: SUPABASE_DB_URL, SUPABASE_DB_USER, SUPABASE_DB_PASSWORD (y opcional PORT).

FROM node:22 AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
# angular.json envía la compilación a ../src/main/resources/static
RUN npm run build

FROM maven:3.9-eclipse-temurin-21 AS backend
WORKDIR /app
COPY pom.xml .
COPY src ./src
COPY --from=frontend /app/src/main/resources/static ./src/main/resources/static
RUN mvn -B package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=backend /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
