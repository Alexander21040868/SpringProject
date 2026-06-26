package org.example.exception;

import org.springframework.http.HttpStatus;

public class EmailAlreadyUsedException extends ApiException {
    public EmailAlreadyUsedException() {
        super(HttpStatus.CONFLICT, "EMAIL_TAKEN", "Email уже занят");
    }
}
