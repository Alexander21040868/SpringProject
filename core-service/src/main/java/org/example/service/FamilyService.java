package org.example.service;

import org.example.dto.CreateFamilyRequest;
import org.example.dto.FamilyDto;
import org.example.entity.Currency;
import org.example.entity.Family;
import org.example.entity.Membership;
import org.example.entity.OperationType;
import org.example.entity.Role;
import org.example.exception.NotFoundException;
import org.example.repository.CategoryRepository;
import org.example.repository.FamilyRepository;
import org.example.repository.MembershipRepository;
import org.example.repository.OperationRepository;
import org.example.security.AuthPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
public class FamilyService {

    private final FamilyRepository familyRepository;
    private final MembershipRepository membershipRepository;
    private final OperationRepository operationRepository;
    private final CategoryRepository categoryRepository;
    private final AccessService access;

    public FamilyService(FamilyRepository familyRepository,
                         MembershipRepository membershipRepository,
                         OperationRepository operationRepository,
                         CategoryRepository categoryRepository,
                         AccessService access) {
        this.familyRepository = familyRepository;
        this.membershipRepository = membershipRepository;
        this.operationRepository = operationRepository;
        this.categoryRepository = categoryRepository;
        this.access = access;
    }

    @Transactional(readOnly = true)
    public List<FamilyDto> listForUser(UUID userId) {
        return membershipRepository.findByUserId(userId).stream()
                .map(m -> toDto(m.getFamily(), m.getRole()))
                .toList();
    }

    @Transactional
    public FamilyDto create(AuthPrincipal principal, CreateFamilyRequest request) {
        Currency currency = request.currency() != null ? request.currency() : Currency.DEFAULT;
        Family family = familyRepository.save(new Family(request.name(), currency));

        Membership owner = new Membership(family, principal.id(), Role.OWNER,
                principal.name(), principal.email(), MemberColors.byIndex(0));
        membershipRepository.save(owner);

        categoryRepository.saveAll(DefaultCategories.forFamily(family));

        return toDto(family, Role.OWNER);
    }

    @Transactional(readOnly = true)
    public FamilyDto get(UUID familyId, UUID userId) {
        Membership m = access.requireMember(familyId, userId);
        return toDto(m.getFamily(), m.getRole());
    }

    @Transactional
    public FamilyDto update(UUID familyId, UUID userId, CreateFamilyRequest request) {
        Membership m = access.requireOwner(familyId, userId);
        Family family = m.getFamily();
        family.setName(request.name());
        if (request.currency() != null) {
            family.setCurrency(request.currency());
        }
        return toDto(family, m.getRole());
    }

    @Transactional
    public void delete(UUID familyId, UUID userId) {
        access.requireOwner(familyId, userId);
        Family family = familyRepository.findById(familyId).orElseThrow(NotFoundException::family);
        familyRepository.delete(family);
    }

    private FamilyDto toDto(Family family, Role myRole) {
        long membersCount = membershipRepository.countByFamily_Id(family.getId());
        BigDecimal income = operationRepository.sumAmount(family.getId(), OperationType.INCOME,
                DateBounds.MIN, DateBounds.MAX);
        BigDecimal expense = operationRepository.sumAmount(family.getId(), OperationType.EXPENSE,
                DateBounds.MIN, DateBounds.MAX);
        BigDecimal balance = income.subtract(expense);
        return new FamilyDto(family.getId(), family.getName(), family.getCurrency(),
                balance, membersCount, myRole, family.getCreatedAt());
    }
}
