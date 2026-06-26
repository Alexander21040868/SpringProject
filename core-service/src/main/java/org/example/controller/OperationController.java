package org.example.controller;

import jakarta.validation.Valid;
import org.example.dto.OperationDto;
import org.example.dto.OperationPageDto;
import org.example.dto.OperationRequest;
import org.example.entity.OperationType;
import org.example.security.AuthPrincipal;
import org.example.service.OperationService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/operations")
public class OperationController {

    private final OperationService operationService;

    public OperationController(OperationService operationService) {
        this.operationService = operationService;
    }

    @GetMapping
    public OperationPageDto list(@AuthenticationPrincipal AuthPrincipal principal,
                                 @RequestParam UUID familyId,
                                 @RequestParam(required = false) OperationType type,
                                 @RequestParam(required = false) UUID categoryId,
                                 @RequestParam(required = false) UUID memberId,
                                 @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                 @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
                                 @RequestParam(required = false) String search,
                                 @RequestParam(defaultValue = "0") int page,
                                 @RequestParam(defaultValue = "20") int size) {
        return operationService.list(familyId, principal.id(), type, categoryId, memberId,
                from, to, search, page, Math.min(size, 100));
    }

    @PostMapping
    public ResponseEntity<OperationDto> create(@AuthenticationPrincipal AuthPrincipal principal,
                                               @Valid @RequestBody OperationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(operationService.create(principal, request));
    }

    @GetMapping("/{operationId}")
    public OperationDto get(@AuthenticationPrincipal AuthPrincipal principal,
                            @PathVariable UUID operationId) {
        return operationService.get(operationId, principal.id());
    }

    @PatchMapping("/{operationId}")
    public OperationDto update(@AuthenticationPrincipal AuthPrincipal principal,
                               @PathVariable UUID operationId,
                               @Valid @RequestBody OperationRequest request) {
        return operationService.update(operationId, principal, request);
    }

    @DeleteMapping("/{operationId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal AuthPrincipal principal,
                       @PathVariable UUID operationId) {
        operationService.delete(operationId, principal);
    }
}
