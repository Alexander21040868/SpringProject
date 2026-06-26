package org.example.service;

final class MemberColors {

    private static final String[] PALETTE = {
            "#185FA5", "#1D9E75", "#E0792B", "#9B51E0",
            "#D7395B", "#2BB0C8", "#C9A227", "#5A6B7B"
    };

    private MemberColors() {
    }

    static String byIndex(long index) {
        int i = (int) Math.floorMod(index, PALETTE.length);
        return PALETTE[i];
    }
}
