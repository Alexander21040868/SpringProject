package org.example.exception;

import org.springframework.http.HttpStatus;

public class ServiceUnavailableException extends ApiException {
    public ServiceUnavailableException() {
        super(HttpStatus.SERVICE_UNAVAILABLE, "CORE_UNAVAILABLE",
                "Сервис данных временно недоступен, попробуйте позже");
    }
}
