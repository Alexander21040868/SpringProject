package org.example.service;

import org.example.entity.Membership;
import org.example.exception.ForbiddenException;
import org.example.repository.MembershipRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class AccessService {

    private final MembershipRepository membershipRepository;

    public AccessService(MembershipRepository membershipRepository) {
        this.membershipRepository = membershipRepository;
    }

    @Transactional(readOnly = true)
    public Membership requireMember(UUID familyId, UUID userId) {
        return membershipRepository.findByFamily_IdAndUserId(familyId, userId)
                .orElseThrow(ForbiddenException::notMember);
    }

    @Transactional(readOnly = true)
    public Membership requireWriter(UUID familyId, UUID userId) {
        Membership m = requireMember(familyId, userId);
        if (!m.getRole().canWrite()) {
            throw ForbiddenException.readOnly();
        }
        return m;
    }

    @Transactional(readOnly = true)
    public Membership requireOwner(UUID familyId, UUID userId) {
        Membership m = requireMember(familyId, userId);
        if (!m.getRole().canManage()) {
            throw ForbiddenException.requiresOwner();
        }
        return m;
    }
}
