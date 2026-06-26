package org.example.controller;

import jakarta.validation.Valid;
import org.example.dto.CreateFamilyRequest;
import org.example.dto.FamilyDto;
import org.example.security.AuthPrincipal;
import org.example.service.FamilyService;
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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/families")
public class FamilyController {

    private final FamilyService familyService;

    public FamilyController(FamilyService familyService) {
        this.familyService = familyService;
    }

    @GetMapping
    public List<FamilyDto> list(@AuthenticationPrincipal AuthPrincipal principal) {
        return familyService.listForUser(principal.id());
    }

    @PostMapping
    public ResponseEntity<FamilyDto> create(@AuthenticationPrincipal AuthPrincipal principal,
                                            @Valid @RequestBody CreateFamilyRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(familyService.create(principal, request));
    }

    @GetMapping("/{familyId}")
    public FamilyDto get(@AuthenticationPrincipal AuthPrincipal principal,
                         @PathVariable UUID familyId) {
        return familyService.get(familyId, principal.id());
    }

    @PatchMapping("/{familyId}")
    public FamilyDto update(@AuthenticationPrincipal AuthPrincipal principal,
                            @PathVariable UUID familyId,
                            @Valid @RequestBody CreateFamilyRequest request) {
        return familyService.update(familyId, principal.id(), request);
    }

    @DeleteMapping("/{familyId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal AuthPrincipal principal,
                       @PathVariable UUID familyId) {
        familyService.delete(familyId, principal.id());
    }
}
