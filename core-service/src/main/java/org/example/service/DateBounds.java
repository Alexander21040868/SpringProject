package org.example.service;

import java.time.LocalDate;

final class DateBounds {

    static final LocalDate MIN = LocalDate.of(1, 1, 1);
    static final LocalDate MAX = LocalDate.of(9999, 12, 31);

    private DateBounds() {
    }
}
