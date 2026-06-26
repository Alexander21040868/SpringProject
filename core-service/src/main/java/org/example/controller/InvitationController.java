package org.example.controller;

import jakarta.validation.Valid;
import org.example.dto.CreateInvitationRequest;
import org.example.dto.FamilyDto;
import org.example.dto.InvitationDto;
import org.example.dto.MyInvitationDto;
import org.example.security.AuthPrincipal;
import org.example.service.MemberService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
public class InvitationController {

    private final MemberService memberService;

    public InvitationController(MemberService memberService) {
        this.memberService = memberService;
    }

    @GetMapping("/families/{familyId}/invitations")
    public List<InvitationDto> list(@AuthenticationPrincipal AuthPrincipal principal,
                                    @PathVariable UUID familyId) {
        return memberService.listInvitations(familyId, principal.id());
    }

    @PostMapping("/families/{familyId}/invitations")
    public ResponseEntity<InvitationDto> create(@AuthenticationPrincipal AuthPrincipal principal,
                                                @PathVariable UUID familyId,
                                                @Valid @RequestBody CreateInvitationRequest request) {
        InvitationDto created = memberService.createInvitation(familyId, principal, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @DeleteMapping("/families/{familyId}/invitations/{invitationId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancel(@AuthenticationPrincipal AuthPrincipal principal,
                       @PathVariable UUID familyId,
                       @PathVariable UUID invitationId) {
        memberService.cancelInvitation(familyId, principal.id(), invitationId);
    }

    @GetMapping("/invitations")
    public List<MyInvitationDto> listMine(@AuthenticationPrincipal AuthPrincipal principal) {
        return memberService.listMyInvitations(principal);
    }

    @PostMapping("/invitations/{invitationId}/accept")
    public FamilyDto accept(@AuthenticationPrincipal AuthPrincipal principal,
                            @PathVariable UUID invitationId) {
        return memberService.accept(invitationId, principal);
    }

    @PostMapping("/invitations/{invitationId}/decline")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void decline(@AuthenticationPrincipal AuthPrincipal principal,
                        @PathVariable UUID invitationId) {
        memberService.decline(invitationId, principal);
    }
}
