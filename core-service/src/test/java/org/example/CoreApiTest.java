package org.example;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.entity.Category;
import org.example.entity.Currency;
import org.example.entity.Family;
import org.example.entity.Membership;
import org.example.entity.OperationType;
import org.example.entity.Role;
import org.example.repository.CategoryRepository;
import org.example.repository.FamilyRepository;
import org.example.repository.MembershipRepository;
import org.example.security.AuthPrincipal;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class CoreApiTest {

    @Autowired
    MockMvc mvc;
    @Autowired
    ObjectMapper json;
    @Autowired
    FamilyRepository families;
    @Autowired
    MembershipRepository memberships;
    @Autowired
    CategoryRepository categories;

    private RequestPostProcessor asUser(UUID id) {
        return authentication(new UsernamePasswordAuthenticationToken(
                new AuthPrincipal(id, "u@example.com", "Тестовый"), null, List.of()));
    }

    private Family seedFamily(UUID userId, Role role) {
        Family fam = families.save(new Family("Семья", Currency.RUB));
        memberships.save(new Membership(fam, userId, role, "Имя", "e@x", "#185FA5"));
        return fam;
    }

    @Test
    void unauthenticatedRequestIsRejected() throws Exception {
        mvc.perform(get("/families"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void createFamilyMakesCreatorOwner() throws Exception {
        UUID user = UUID.randomUUID();
        mvc.perform(post("/families").with(asUser(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("name", "Моя семья"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Моя семья"))
                .andExpect(jsonPath("$.myRole").value("OWNER"))
                .andExpect(jsonPath("$.membersCount").value(1));
    }

    @Test
    void nonMemberCannotReadFamily() throws Exception {
        Family fam = seedFamily(UUID.randomUUID(), Role.OWNER);
        mvc.perform(get("/families/" + fam.getId()).with(asUser(UUID.randomUUID())))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    void negativeAmountIsRejectedByValidation() throws Exception {
        UUID user = UUID.randomUUID();
        Family fam = seedFamily(user, Role.OWNER);
        Category cat = categories.save(new Category(fam, "Еда", OperationType.EXPENSE, null, null));

        var body = Map.of("familyId", fam.getId().toString(), "type", "EXPENSE",
                "amount", -10, "date", "2026-06-10", "categoryId", cat.getId().toString());
        mvc.perform(post("/operations").with(asUser(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(body)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.fieldErrors[0].field").value("amount"));
    }

    @Test
    void categoryTypeMismatchIsRejected() throws Exception {
        UUID user = UUID.randomUUID();
        Family fam = seedFamily(user, Role.OWNER);
        Category income = categories.save(new Category(fam, "ЗП", OperationType.INCOME, null, null));

        var body = Map.of("familyId", fam.getId().toString(), "type", "EXPENSE",
                "amount", 100, "date", "2026-06-10", "categoryId", income.getId().toString());
        mvc.perform(post("/operations").with(asUser(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(body)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("CATEGORY_TYPE_MISMATCH"));
    }

    @Test
    void viewerCannotCreateCategory() throws Exception {
        UUID viewer = UUID.randomUUID();
        Family fam = seedFamily(viewer, Role.VIEWER);
        var body = Map.of("familyId", fam.getId().toString(), "name", "Еда", "type", "EXPENSE");
        mvc.perform(post("/categories").with(asUser(viewer))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(body)))
                .andExpect(status().isForbidden());
    }
}
