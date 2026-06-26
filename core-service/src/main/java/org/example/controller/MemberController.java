package org.example.controller;

import jakarta.validation.Valid;
import org.example.dto.MemberDto;
import org.example.dto.UpdateMemberRoleRequest;
import org.example.security.AuthPrincipal;
import org.example.service.MemberService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/families/{familyId}/members")
public class MemberController {

    private final MemberService memberService;

    public MemberController(MemberService memberService) {
        this.memberService = memberService;
    }

    @GetMapping
    public List<MemberDto> list(@AuthenticationPrincipal AuthPrincipal principal,
                                @PathVariable UUID familyId) {
        return memberService.list(familyId, principal.id());
    }

    @PatchMapping("/{memberId}")
    public MemberDto updateRole(@AuthenticationPrincipal AuthPrincipal principal,
                                @PathVariable UUID familyId,
                                @PathVariable UUID memberId,
                                @Valid @RequestBody UpdateMemberRoleRequest request) {
        return memberService.updateRole(familyId, principal.id(), memberId, request.role());
    }

    @DeleteMapping("/{memberId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@AuthenticationPrincipal AuthPrincipal principal,
                       @PathVariable UUID familyId,
                       @PathVariable UUID memberId) {
        memberService.remove(familyId, principal.id(), memberId);
    }
}
