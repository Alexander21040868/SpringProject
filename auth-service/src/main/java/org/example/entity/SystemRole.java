package org.example.entity;

public enum SystemRole {

    USER,

    ADMIN;

    public String authority() {
        return "ROLE_" + name();
    }
}
