package org.example.service;

import org.example.dto.CategoryDto;
import org.example.dto.MemberDto;
import org.example.dto.OperationDto;
import org.example.dto.OperationPageDto;
import org.example.dto.OperationRequest;
import org.example.entity.Category;
import org.example.entity.Currency;
import org.example.entity.Family;
import org.example.entity.Membership;
import org.example.entity.Operation;
import org.example.entity.OperationType;
import org.example.exception.BadRequestException;
import org.example.exception.NotFoundException;
import org.example.repository.CategoryRepository;
import org.example.repository.MembershipRepository;
import org.example.repository.OperationRepository;
import org.example.repository.OperationSpecifications;
import org.example.security.AuthPrincipal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class OperationService {

    private final OperationRepository operationRepository;
    private final CategoryRepository categoryRepository;
    private final MembershipRepository membershipRepository;
    private final AccessService access;

    public OperationService(OperationRepository operationRepository,
                            CategoryRepository categoryRepository,
                            MembershipRepository membershipRepository,
                            AccessService access) {
        this.operationRepository = operationRepository;
        this.categoryRepository = categoryRepository;
        this.membershipRepository = membershipRepository;
        this.access = access;
    }

    @Transactional(readOnly = true)
    public OperationPageDto list(UUID familyId, UUID userId, OperationType type, UUID categoryId,
                                 UUID memberId, LocalDate from, LocalDate to, String search,
                                 int page, int size) {
        access.requireMember(familyId, userId);
        Pageable pageable = PageRequest.of(page, size,
                Sort.by(Sort.Order.desc("date"), Sort.Order.desc("createdAt")));
        Specification<Operation> spec =
                OperationSpecifications.matching(familyId, type, categoryId, memberId, from, to, search);
        Page<Operation> result = operationRepository.findAll(spec, pageable);

        Map<UUID, Membership> membersByUser = membersByUser(familyId);
        Map<UUID, Category> categoriesById = categoryRepository.findByFamily_Id(familyId).stream()
                .collect(Collectors.toMap(Category::getId, Function.identity()));
        var content = result.getContent().stream()
                .map(op -> toDto(op, membersByUser, categoriesById))
                .toList();

        LocalDate fromBound = from != null ? from : DateBounds.MIN;
        LocalDate toBound = to != null ? to : DateBounds.MAX;
        // Тоталы считаем по тем же фильтрам, что и содержимое страницы (категория/участник/поиск),
        // иначе суммы не совпадают с отфильтрованным списком. Фильтр по типу учитываем отдельно:
        // если пользователь сузил список до одного типа, противоположный тотал должен быть 0.
        String searchParam = (search != null && !search.isBlank())
                ? "%" + search.trim().toLowerCase() + "%" : null;
        BigDecimal totalIncome = (type == null || type == OperationType.INCOME)
                ? operationRepository.sumAmountFiltered(familyId, OperationType.INCOME, categoryId, memberId,
                        fromBound, toBound, searchParam)
                : BigDecimal.ZERO;
        BigDecimal totalExpense = (type == null || type == OperationType.EXPENSE)
                ? operationRepository.sumAmountFiltered(familyId, OperationType.EXPENSE, categoryId, memberId,
                        fromBound, toBound, searchParam)
                : BigDecimal.ZERO;

        return new OperationPageDto(content, result.getNumber(), result.getSize(),
                result.getTotalElements(), result.getTotalPages(), totalIncome, totalExpense);
    }

    @Transactional(readOnly = true)
    public OperationDto get(UUID operationId, UUID userId) {
        Operation op = operationRepository.findById(operationId).orElseThrow(NotFoundException::operation);
        access.requireMember(op.getFamily().getId(), userId);
        return toDto(op, membersByUser(op.getFamily().getId()));
    }

    @Transactional
    public OperationDto create(AuthPrincipal principal, OperationRequest request) {
        Membership me = access.requireWriter(request.familyId(), principal.id());
        Family family = me.getFamily();
        Category category = resolveCategory(request, family.getId());
        UUID memberUserId = resolveMember(request, family.getId(), principal.id());

        Currency currency = request.currency() != null ? request.currency() : family.getCurrency();
        Operation op = new Operation(family, request.type(), request.amount(), currency,
                request.date(), request.description(), category, memberUserId, principal.id());
        operationRepository.save(op);
        return toDto(op, membersByUser(family.getId()));
    }

    @Transactional
    public OperationDto update(UUID operationId, AuthPrincipal principal, OperationRequest request) {
        Operation op = operationRepository.findById(operationId).orElseThrow(NotFoundException::operation);
        UUID familyId = op.getFamily().getId();
        access.requireWriter(familyId, principal.id());

        Category category = resolveCategory(request, familyId);
        op.setType(request.type());
        op.setAmount(request.amount());
        if (request.currency() != null) {
            op.setCurrency(request.currency());
        }
        op.setDate(request.date());
        op.setDescription(request.description());
        op.setCategory(category);
        op.setMemberUserId(resolveMember(request, familyId, op.getMemberUserId()));
        return toDto(op, membersByUser(familyId));
    }

    @Transactional
    public void delete(UUID operationId, AuthPrincipal principal) {
        Operation op = operationRepository.findById(operationId).orElseThrow(NotFoundException::operation);
        access.requireWriter(op.getFamily().getId(), principal.id());
        operationRepository.delete(op);
    }

    private Category resolveCategory(OperationRequest request, UUID familyId) {
        Category category = categoryRepository.findByIdAndFamily_Id(request.categoryId(), familyId)
                .orElseThrow(NotFoundException::category);
        if (category.getType() != request.type()) {
            throw new BadRequestException("CATEGORY_TYPE_MISMATCH",
                    "Тип категории не совпадает с типом операции");
        }
        return category;
    }

    private UUID resolveMember(OperationRequest request, UUID familyId, UUID fallback) {
        if (request.memberId() == null) {
            return fallback;
        }
        if (!membershipRepository.existsByFamily_IdAndUserId(familyId, request.memberId())) {
            throw new BadRequestException("MEMBER_NOT_IN_FAMILY", "Участник не состоит в этой семье");
        }
        return request.memberId();
    }

    private Map<UUID, Membership> membersByUser(UUID familyId) {
        return membershipRepository.findByFamily_Id(familyId).stream()
                .collect(Collectors.toMap(Membership::getUserId, Function.identity(), (a, b) -> a));
    }

    private OperationDto toDto(Operation op, Map<UUID, Membership> membersByUser) {
        CategoryDto category = CategoryDto.from(op.getCategory());
        Membership m = membersByUser.get(op.getMemberUserId());
        MemberDto member = m != null ? MemberDto.from(m) : null;
        return new OperationDto(op.getId(), op.getFamily().getId(), op.getType(), op.getAmount(),
                op.getCurrency(), op.getDate(), op.getDescription(), category, member, op.getCreatedAt());
    }

    private OperationDto toDto(Operation op, Map<UUID, Membership> membersByUser,
                              Map<UUID, Category> categoriesById) {
        Category cat = categoriesById.get(op.getCategory().getId());
        CategoryDto category = cat != null ? CategoryDto.from(cat) : null;
        Membership m = membersByUser.get(op.getMemberUserId());
        MemberDto member = m != null ? MemberDto.from(m) : null;
        return new OperationDto(op.getId(), op.getFamily().getId(), op.getType(), op.getAmount(),
                op.getCurrency(), op.getDate(), op.getDescription(), category, member, op.getCreatedAt());
    }
}
