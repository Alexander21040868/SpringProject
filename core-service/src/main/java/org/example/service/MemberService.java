package org.example.service;

import org.example.dto.CreateInvitationRequest;
import org.example.dto.FamilyDto;
import org.example.dto.InvitationDto;
import org.example.dto.MemberDto;
import org.example.dto.MyInvitationDto;
import org.example.entity.Family;
import org.example.entity.Invitation;
import org.example.entity.InvitationStatus;
import org.example.entity.Membership;
import org.example.entity.Role;
import org.example.client.AuthClient;
import org.example.exception.BadRequestException;
import org.example.exception.ConflictException;
import org.example.exception.ForbiddenException;
import org.example.exception.NotFoundException;
import org.example.repository.InvitationRepository;
import org.example.repository.MembershipRepository;
import org.example.security.AuthPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class MemberService {

    private final MembershipRepository membershipRepository;
    private final InvitationRepository invitationRepository;
    private final AccessService access;
    private final FamilyService familyService;
    private final AuthClient authClient;

    public MemberService(MembershipRepository membershipRepository,
                         InvitationRepository invitationRepository,
                         AccessService access,
                         FamilyService familyService,
                         AuthClient authClient) {
        this.membershipRepository = membershipRepository;
        this.invitationRepository = invitationRepository;
        this.access = access;
        this.familyService = familyService;
        this.authClient = authClient;
    }

    @Transactional(readOnly = true)
    public List<MemberDto> list(UUID familyId, UUID userId) {
        access.requireMember(familyId, userId);
        return membershipRepository.findByFamily_Id(familyId).stream()
                .map(MemberDto::from)
                .toList();
    }

    @Transactional
    public MemberDto updateRole(UUID familyId, UUID userId, UUID memberId, Role newRole) {
        access.requireOwner(familyId, userId);
        Membership target = loadMembership(familyId, memberId);
        if (target.getRole() == Role.OWNER && newRole != Role.OWNER && isLastOwner(familyId)) {
            throw new BadRequestException("LAST_OWNER", "Нельзя снять роль с последнего владельца семьи");
        }
        target.setRole(newRole);
        return MemberDto.from(target);
    }

    @Transactional
    public void remove(UUID familyId, UUID userId, UUID memberId) {
        access.requireOwner(familyId, userId);
        Membership target = loadMembership(familyId, memberId);
        if (target.getRole() == Role.OWNER && isLastOwner(familyId)) {
            throw new BadRequestException("LAST_OWNER", "Нельзя удалить последнего владельца семьи");
        }
        membershipRepository.delete(target);
    }

    @Transactional(readOnly = true)
    public List<InvitationDto> listInvitations(UUID familyId, UUID userId) {
        access.requireOwner(familyId, userId);
        return invitationRepository.findByFamily_Id(familyId).stream()
                .filter(invitation -> invitation.getStatus() == InvitationStatus.PENDING)
                .map(InvitationDto::from)
                .toList();
    }

    @Transactional
    public InvitationDto createInvitation(UUID familyId, AuthPrincipal principal,
                                          CreateInvitationRequest request, String bearerToken) {
        Membership owner = access.requireOwner(familyId, principal.id());
        String email = request.email().trim().toLowerCase();
        if (invitationRepository.existsByFamily_IdAndEmailAndStatus(familyId, email, InvitationStatus.PENDING)) {
            throw new ConflictException("INVITATION_EXISTS", "Приглашение на этот email уже отправлено");
        }
        if (!authClient.emailRegistered(email, bearerToken)) {
            throw new BadRequestException("USER_NOT_REGISTERED",
                    "Пользователь с таким email не зарегистрирован в Финпульсе");
        }
        Invitation invitation = new Invitation(owner.getFamily(), email, request.role(),
                principal.id(), principal.name());
        invitationRepository.save(invitation);
        return InvitationDto.from(invitation);
    }

    @Transactional
    public void cancelInvitation(UUID familyId, UUID userId, UUID invitationId) {
        access.requireOwner(familyId, userId);
        Invitation invitation = invitationRepository.findByIdAndFamily_Id(invitationId, familyId)
                .orElseThrow(NotFoundException::invitation);
        invitation.setStatus(InvitationStatus.CANCELLED);
    }

    @Transactional(readOnly = true)
    public List<MyInvitationDto> listMyInvitations(AuthPrincipal principal) {
        return invitationRepository.findByEmailAndStatus(normalize(principal.email()), InvitationStatus.PENDING)
                .stream()
                .map(MyInvitationDto::from)
                .toList();
    }

    @Transactional
    public FamilyDto accept(UUID invitationId, AuthPrincipal principal) {
        Invitation invitation = loadOwnPending(invitationId, principal);
        Family family = invitation.getFamily();

        if (!membershipRepository.existsByFamily_IdAndUserId(family.getId(), principal.id())) {
            long index = membershipRepository.countByFamily_Id(family.getId());
            membershipRepository.save(new Membership(family, principal.id(), invitation.getRole(),
                    principal.name(), principal.email(), MemberColors.byIndex(index)));
        }
        invitation.setStatus(InvitationStatus.ACCEPTED);
        return familyService.get(family.getId(), principal.id());
    }

    @Transactional
    public void decline(UUID invitationId, AuthPrincipal principal) {
        Invitation invitation = loadOwnPending(invitationId, principal);
        invitation.setStatus(InvitationStatus.CANCELLED);
    }

    private Invitation loadOwnPending(UUID invitationId, AuthPrincipal principal) {
        Invitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(NotFoundException::invitation);
        if (!normalize(principal.email()).equals(normalize(invitation.getEmail()))) {
            throw new ForbiddenException("Это приглашение адресовано другому пользователю");
        }
        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new BadRequestException("INVITATION_NOT_PENDING", "Приглашение уже обработано");
        }
        return invitation;
    }

    private Membership loadMembership(UUID familyId, UUID memberId) {
        Membership target = membershipRepository.findById(memberId)
                .orElseThrow(NotFoundException::member);
        if (!target.getFamily().getId().equals(familyId)) {
            throw NotFoundException.member();
        }
        return target;
    }

    private boolean isLastOwner(UUID familyId) {
        long owners = membershipRepository.findByFamily_Id(familyId).stream()
                .filter(m -> m.getRole() == Role.OWNER)
                .count();
        return owners <= 1;
    }

    private static String normalize(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
