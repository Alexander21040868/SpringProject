package org.example.exception;

import org.springframework.http.HttpStatus;

public class NotFoundException extends ApiException {

    public NotFoundException(String code, String message) {
        super(HttpStatus.NOT_FOUND, code, message);
    }

    public static NotFoundException family() {
        return new NotFoundException("FAMILY_NOT_FOUND", "Семья не найдена");
    }

    public static NotFoundException member() {
        return new NotFoundException("MEMBER_NOT_FOUND", "Участник не найден");
    }

    public static NotFoundException category() {
        return new NotFoundException("CATEGORY_NOT_FOUND", "Категория не найдена");
    }

    public static NotFoundException operation() {
        return new NotFoundException("OPERATION_NOT_FOUND", "Операция не найдена");
    }

    public static NotFoundException invitation() {
        return new NotFoundException("INVITATION_NOT_FOUND", "Приглашение не найдено");
    }
}
