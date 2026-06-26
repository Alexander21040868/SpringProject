package org.example.exception;

import org.springframework.http.HttpStatus;

public class ForbiddenException extends ApiException {
    public ForbiddenException() {
        super(HttpStatus.FORBIDDEN, "FORBIDDEN", "Нет доступа к данным этой семьи");
    }
}
