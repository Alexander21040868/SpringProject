package org.example.exception;

import org.springframework.http.HttpStatus;

public class ForbiddenException extends ApiException {

    public ForbiddenException(String message) {
        super(HttpStatus.FORBIDDEN, "FORBIDDEN", message);
    }

    public static ForbiddenException notMember() {
        return new ForbiddenException("Нет доступа к данным этой семьи");
    }

    public static ForbiddenException requiresOwner() {
        return new ForbiddenException("Действие доступно только владельцу семьи (OWNER)");
    }

    public static ForbiddenException readOnly() {
        return new ForbiddenException("Недостаточно прав для изменения данных");
    }
}
