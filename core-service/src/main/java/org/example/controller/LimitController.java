package org.example.controller;

import jakarta.validation.Valid;
import org.example.dto.LimitRequest;
import org.example.dto.LimitStatusDto;
import org.example.security.AuthPrincipal;
import org.example.service.LimitService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/limits")
public class LimitController {

    private final LimitService limitService;

    public LimitController(LimitService limitService) {
        this.limitService = limitService;
    }

    @GetMapping
    public List<LimitStatusDto> getLimits(@AuthenticationPrincipal AuthPrincipal principal,
                                          @RequestParam UUID familyId,
                                          @RequestParam(required = false) String month) {
        return limitService.getLimits(familyId, principal.id(), month);
    }

    @PutMapping
    public List<LimitStatusDto> setLimits(@AuthenticationPrincipal AuthPrincipal principal,
                                          @RequestParam UUID familyId,
                                          @Valid @RequestBody List<@Valid LimitRequest> limits) {
        return limitService.setLimits(familyId, principal.id(), limits);
    }
}
