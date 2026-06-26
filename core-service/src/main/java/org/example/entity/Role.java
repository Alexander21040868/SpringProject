package org.example.entity;

public enum Role {
    OWNER,
    MEMBER,
    VIEWER;

    public boolean canWrite() {
        return this == OWNER || this == MEMBER;
    }

    public boolean canManage() {
        return this == OWNER;
    }
}
