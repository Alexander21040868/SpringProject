package org.example.service;

import org.example.client.OperationView;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.List;

@Component
public class CsvExporter {

    private static final String SEP = ";";
    private static final String EOL = "\r\n";
    private static final byte[] BOM = {(byte) 0xEF, (byte) 0xBB, (byte) 0xBF};

    public byte[] toCsv(List<OperationView> operations) {
        StringBuilder sb = new StringBuilder();
        sb.append(String.join(SEP, "Дата", "Тип", "Сумма", "Валюта", "Категория", "Участник", "Описание"))
                .append(EOL);
        for (OperationView op : operations) {
            sb.append(cell(op.date() != null ? op.date().toString() : "")).append(SEP)
                    .append(cell(op.type() != null ? op.type().name() : "")).append(SEP)
                    .append(cell(op.amount() != null ? op.amount().toPlainString() : "")).append(SEP)
                    .append(cell(op.currency())).append(SEP)
                    .append(cell(op.category() != null ? op.category().name() : "")).append(SEP)
                    .append(cell(op.member() != null ? op.member().name() : "")).append(SEP)
                    .append(cell(op.description())).append(EOL);
        }
        byte[] text = sb.toString().getBytes(StandardCharsets.UTF_8);
        byte[] out = new byte[BOM.length + text.length];
        System.arraycopy(BOM, 0, out, 0, BOM.length);
        System.arraycopy(text, 0, out, BOM.length, text.length);
        return out;
    }

    private String cell(String value) {
        if (value == null || value.isEmpty()) {
            return "";
        }
        // Защита от CSV-инъекции: значения, начинающиеся с = + - @ (или tab/CR), Excel трактует
        // как формулу. Префиксуем апострофом, чтобы ячейка осталась текстом.
        String safe = value;
        char first = safe.charAt(0);
        if (first == '=' || first == '+' || first == '-' || first == '@' || first == '\t' || first == '\r') {
            safe = "'" + safe;
        }
        if (safe.contains(SEP) || safe.contains("\"") || safe.contains("\n") || safe.contains("\r")) {
            return "\"" + safe.replace("\"", "\"\"") + "\"";
        }
        return safe;
    }
}
