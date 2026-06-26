package org.example.service;

import org.example.entity.Category;
import org.example.entity.Family;
import org.example.entity.OperationType;

import java.util.List;

final class DefaultCategories {

    private record Def(String name, OperationType type, String icon, String color) {
    }

    private static final List<Def> DEFAULTS = List.of(
            new Def("Продукты", OperationType.EXPENSE, "shopping-cart", "#1D9E75"),
            new Def("Транспорт", OperationType.EXPENSE, "car", "#378ADD"),
            new Def("Развлечения", OperationType.EXPENSE, "device-gamepad-2", "#D4537E"),
            new Def("Здоровье", OperationType.EXPENSE, "heartbeat", "#BA7517"),
            new Def("Образование", OperationType.EXPENSE, "school", "#7F77DD"),
            new Def("Кафе", OperationType.EXPENSE, "coffee", "#D85A30"),
            new Def("Зарплата", OperationType.INCOME, "briefcase", "#1D9E75"),
            new Def("Бизнес", OperationType.INCOME, "building-store", "#378ADD"),
            new Def("Инвестиции", OperationType.INCOME, "chart-line", "#7F77DD"),
            new Def("Подработка", OperationType.INCOME, "tools", "#BA7517")
    );

    private DefaultCategories() {
    }

    static List<Category> forFamily(Family family) {
        return DEFAULTS.stream()
                .map(d -> new Category(family, d.name(), d.type(), d.icon(), d.color()))
                .toList();
    }
}
