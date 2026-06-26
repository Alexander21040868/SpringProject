package org.example.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiError(
        Instant timestamp,
        int status,
        String code,
        String message,
        String path,
        List<FieldError> fieldErrors
) {

    public record FieldError(String field, String message) {
    }

    public static ApiError of(HttpStatus status, String code, String message, String path) {
        return new ApiError(Instant.now(), status.value(), code, message, path, null);
    }

    public static ApiError validation(String message, String path, List<FieldError> fieldErrors) {
        return new ApiError(Instant.now(), HttpStatus.BAD_REQUEST.value(),
                "VALIDATION_ERROR", message, path, fieldErrors);
    }
}
