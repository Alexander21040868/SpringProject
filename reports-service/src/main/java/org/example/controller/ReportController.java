package org.example.controller;

import org.example.client.OperationView;
import org.example.dto.CashflowPointDto;
import org.example.dto.CategorySliceDto;
import org.example.dto.Granularity;
import org.example.dto.MemberSliceDto;
import org.example.dto.OperationType;
import org.example.dto.SummaryReportDto;
import org.example.exception.BadRequestException;
import org.example.service.CsvExporter;
import org.example.service.ReportService;
import org.example.service.XlsxExporter;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/reports")
public class ReportController {

    private static final String BEARER = "Bearer ";

    private final ReportService reportService;
    private final CsvExporter csvExporter;
    private final XlsxExporter xlsxExporter;

    public ReportController(ReportService reportService, CsvExporter csvExporter, XlsxExporter xlsxExporter) {
        this.reportService = reportService;
        this.csvExporter = csvExporter;
        this.xlsxExporter = xlsxExporter;
    }

    @GetMapping("/summary")
    public SummaryReportDto summary(@RequestHeader(HttpHeaders.AUTHORIZATION) String authorization,
                                    @RequestParam UUID familyId,
                                    @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                    @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
                                    @RequestParam(required = false) List<UUID> memberIds) {
        requireValidRange(from, to);
        return reportService.summary(token(authorization), familyId, from, to, members(memberIds));
    }

    @GetMapping("/by-category")
    public List<CategorySliceDto> byCategory(@RequestHeader(HttpHeaders.AUTHORIZATION) String authorization,
                                             @RequestParam UUID familyId,
                                             @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                             @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
                                             @RequestParam(required = false) List<UUID> memberIds,
                                             @RequestParam(required = false) OperationType type) {
        requireValidRange(from, to);
        return reportService.byCategory(token(authorization), familyId, from, to, members(memberIds), type);
    }

    @GetMapping("/by-member")
    public List<MemberSliceDto> byMember(@RequestHeader(HttpHeaders.AUTHORIZATION) String authorization,
                                         @RequestParam UUID familyId,
                                         @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                         @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
                                         @RequestParam(required = false) List<UUID> memberIds,
                                         @RequestParam(required = false) OperationType type) {
        requireValidRange(from, to);
        return reportService.byMember(token(authorization), familyId, from, to, members(memberIds), type);
    }

    @GetMapping("/cashflow")
    public List<CashflowPointDto> cashflow(@RequestHeader(HttpHeaders.AUTHORIZATION) String authorization,
                                           @RequestParam UUID familyId,
                                           @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                           @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
                                           @RequestParam(required = false) List<UUID> memberIds,
                                           @RequestParam(required = false) Granularity granularity) {
        requireValidRange(from, to);
        return reportService.cashflow(token(authorization), familyId, from, to, members(memberIds), granularity);
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> export(@RequestHeader(HttpHeaders.AUTHORIZATION) String authorization,
                                         @RequestParam UUID familyId,
                                         @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                         @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
                                         @RequestParam(required = false) List<UUID> memberIds,
                                         @RequestParam String format) {
        requireValidRange(from, to);
        String fmt = format == null ? "" : format.toLowerCase();
        List<OperationView> ops = reportService.operationsForExport(
                token(authorization), familyId, from, to, members(memberIds));

        byte[] body;
        MediaType contentType;
        switch (fmt) {
            case "csv" -> {
                body = csvExporter.toCsv(ops);
                contentType = MediaType.parseMediaType("text/csv; charset=UTF-8");
            }
            case "xlsx" -> {
                body = xlsxExporter.toXlsx(ops);
                contentType = MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            }
            default -> throw new BadRequestException("UNSUPPORTED_FORMAT",
                    "Поддерживаются форматы csv и xlsx");
        }
        String filename = "report-" + from + "_" + to + "." + fmt;
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(contentType)
                .body(body);
    }

    private String token(String authorization) {
        if (authorization != null && authorization.startsWith(BEARER)) {
            return authorization.substring(BEARER.length());
        }
        throw new BadRequestException("MISSING_TOKEN", "Отсутствует токен авторизации");
    }

    private Set<UUID> members(List<UUID> memberIds) {
        return memberIds == null ? Collections.emptySet() : Set.copyOf(memberIds);
    }

    private void requireValidRange(LocalDate from, LocalDate to) {
        if (from.isAfter(to)) {
            throw new BadRequestException("INVALID_RANGE", "Дата начала не может быть позже даты конца");
        }
    }
}
