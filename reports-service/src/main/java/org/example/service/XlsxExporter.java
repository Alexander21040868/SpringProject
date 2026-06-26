package org.example.service;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.example.client.OperationView;
import org.example.exception.BadRequestException;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

@Component
public class XlsxExporter {

    private static final String[] HEADERS =
            {"Дата", "Тип", "Сумма", "Валюта", "Категория", "Участник", "Описание"};

    public byte[] toXlsx(List<OperationView> operations) {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Операции");

            CellStyle headerStyle = workbook.createCellStyle();
            Font bold = workbook.createFont();
            bold.setBold(true);
            headerStyle.setFont(bold);

            Row header = sheet.createRow(0);
            for (int i = 0; i < HEADERS.length; i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(HEADERS[i]);
                cell.setCellStyle(headerStyle);
            }

            int r = 1;
            for (OperationView op : operations) {
                Row row = sheet.createRow(r++);
                row.createCell(0).setCellValue(op.date() != null ? op.date().toString() : "");
                row.createCell(1).setCellValue(op.type() != null ? op.type().name() : "");
                if (op.amount() != null) {
                    row.createCell(2).setCellValue(op.amount().doubleValue());
                }
                row.createCell(3).setCellValue(nullToEmpty(op.currency()));
                row.createCell(4).setCellValue(op.category() != null ? op.category().name() : "");
                row.createCell(5).setCellValue(op.member() != null ? op.member().name() : "");
                row.createCell(6).setCellValue(nullToEmpty(op.description()));
            }

            for (int i = 0; i < HEADERS.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new BadRequestException("EXPORT_FAILED", "Не удалось сформировать XLSX");
        }
    }

    private String nullToEmpty(String s) {
        return s == null ? "" : s;
    }
}
