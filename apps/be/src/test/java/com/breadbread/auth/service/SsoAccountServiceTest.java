package com.breadbread.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.breadbread.auth.dto.SocialUserInfo;
import com.breadbread.auth.entity.SsoAccount;
import com.breadbread.auth.entity.SsoProvider;
import com.breadbread.auth.repository.SsoAccountRepository;
import com.breadbread.global.util.NicknameGenerator;
import com.breadbread.user.entity.User;
import com.breadbread.user.entity.UserRole;
import com.breadbread.user.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class SsoAccountServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private SsoAccountRepository ssoAccountRepository;
    @Mock private NicknameGenerator nicknameGenerator;

    @InjectMocks private SsoAccountService ssoAccountService;

    @Test
    void findOrCreate_returns_existing_when_account_present() {
        User user = user(1L, "고정닉");
        SsoAccount existing =
                SsoAccount.builder()
                        .provider(SsoProvider.KAKAO)
                        .providerUserId("k-99")
                        .user(user)
                        .build();
        ReflectionTestUtils.setField(existing, "id", 50L);
        SocialUserInfo info =
                SocialUserInfo.builder()
                        .providerUserId("k-99")
                        .email("k@t.com")
                        .name("이름")
                        .nickname("닉")
                        .build();

        when(ssoAccountRepository.findByProviderAndProviderUserId(SsoProvider.KAKAO, "k-99"))
                .thenReturn(Optional.of(existing));

        SsoAccount result = ssoAccountService.findOrCreateSsoAccount(SsoProvider.KAKAO, info);

        assertThat(result).isSameAs(existing);
        verify(userRepository, never()).save(any(User.class));
        verify(ssoAccountRepository, never()).save(any(SsoAccount.class));
    }

    @Test
    void findOrCreate_saves_user_with_social_nickname_when_unique() {
        SocialUserInfo info =
                SocialUserInfo.builder()
                        .providerUserId("g-1")
                        .email("g@t.com")
                        .name("구글")
                        .nickname("유니크닉")
                        .build();
        when(ssoAccountRepository.findByProviderAndProviderUserId(SsoProvider.GOOGLE, "g-1"))
                .thenReturn(Optional.empty());
        when(userRepository.existsByNickname("유니크닉")).thenReturn(false);
        when(userRepository.save(any(User.class)))
                .thenAnswer(
                        inv -> {
                            User u = inv.getArgument(0);
                            ReflectionTestUtils.setField(u, "id", 200L);
                            return u;
                        });
        SsoAccount savedAccount =
                SsoAccount.builder()
                        .provider(SsoProvider.GOOGLE)
                        .providerUserId("g-1")
                        .user(null)
                        .build();
        when(ssoAccountRepository.save(any(SsoAccount.class)))
                .thenAnswer(
                        inv -> {
                            SsoAccount a = inv.getArgument(0);
                            ReflectionTestUtils.setField(a, "id", 300L);
                            return a;
                        });

        SsoAccount result = ssoAccountService.findOrCreateSsoAccount(SsoProvider.GOOGLE, info);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        assertThat(userCaptor.getValue().getNickname()).isEqualTo("유니크닉");
        assertThat(userCaptor.getValue().getName()).isEqualTo("구글");
        assertThat(userCaptor.getValue().getEmail()).isEqualTo("g@t.com");
        assertThat(userCaptor.getValue().getRole()).isEqualTo(UserRole.ROLE_USER);
        assertThat(result.getProvider()).isEqualTo(SsoProvider.GOOGLE);
        assertThat(result.getProviderUserId()).isEqualTo("g-1");
        verify(nicknameGenerator, never()).generate();
    }

    @Test
    void findOrCreate_uses_generated_nickname_when_social_nickname_blank() {
        SocialUserInfo info =
                SocialUserInfo.builder()
                        .providerUserId("k-2")
                        .email("k2@t.com")
                        .name("이름만")
                        .nickname(null)
                        .build();
        when(ssoAccountRepository.findByProviderAndProviderUserId(SsoProvider.KAKAO, "k-2"))
                .thenReturn(Optional.empty());
        when(nicknameGenerator.generate()).thenReturn("생성닉1234");
        when(userRepository.existsByNickname("생성닉1234")).thenReturn(false);
        when(userRepository.save(any(User.class)))
                .thenAnswer(
                        inv -> {
                            User u = inv.getArgument(0);
                            ReflectionTestUtils.setField(u, "id", 201L);
                            return u;
                        });
        when(ssoAccountRepository.save(any(SsoAccount.class)))
                .thenAnswer(
                        inv -> {
                            SsoAccount a = inv.getArgument(0);
                            ReflectionTestUtils.setField(a, "id", 301L);
                            return a;
                        });

        ssoAccountService.findOrCreateSsoAccount(SsoProvider.KAKAO, info);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        assertThat(userCaptor.getValue().getNickname()).isEqualTo("생성닉1234");
        verify(nicknameGenerator).generate();
    }

    @Test
    void findOrCreate_uses_generated_nickname_when_social_nickname_taken() {
        SocialUserInfo info =
                SocialUserInfo.builder()
                        .providerUserId("k-3")
                        .email("k3@t.com")
                        .name("이름")
                        .nickname("중복닉")
                        .build();
        when(ssoAccountRepository.findByProviderAndProviderUserId(SsoProvider.KAKAO, "k-3"))
                .thenReturn(Optional.empty());
        when(userRepository.existsByNickname("중복닉")).thenReturn(true);
        when(nicknameGenerator.generate()).thenReturn("새닉5678");
        when(userRepository.existsByNickname("새닉5678")).thenReturn(false);
        when(userRepository.save(any(User.class)))
                .thenAnswer(
                        inv -> {
                            User u = inv.getArgument(0);
                            ReflectionTestUtils.setField(u, "id", 202L);
                            return u;
                        });
        when(ssoAccountRepository.save(any(SsoAccount.class)))
                .thenAnswer(
                        inv -> {
                            SsoAccount a = inv.getArgument(0);
                            ReflectionTestUtils.setField(a, "id", 302L);
                            return a;
                        });

        ssoAccountService.findOrCreateSsoAccount(SsoProvider.KAKAO, info);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        assertThat(userCaptor.getValue().getNickname()).isEqualTo("새닉5678");
    }

    @Test
    void findOrCreate_regenerates_nickname_when_generator_collides_once() {
        SocialUserInfo info =
                SocialUserInfo.builder()
                        .providerUserId("k-4")
                        .email("k4@t.com")
                        .name("이름")
                        .nickname(null)
                        .build();
        when(ssoAccountRepository.findByProviderAndProviderUserId(SsoProvider.KAKAO, "k-4"))
                .thenReturn(Optional.empty());
        when(nicknameGenerator.generate()).thenReturn("첫닉9999", "둘째닉8888");
        when(userRepository.existsByNickname("첫닉9999")).thenReturn(true);
        when(userRepository.existsByNickname("둘째닉8888")).thenReturn(false);
        when(userRepository.save(any(User.class)))
                .thenAnswer(
                        inv -> {
                            User u = inv.getArgument(0);
                            ReflectionTestUtils.setField(u, "id", 203L);
                            return u;
                        });
        when(ssoAccountRepository.save(any(SsoAccount.class)))
                .thenAnswer(
                        inv -> {
                            SsoAccount a = inv.getArgument(0);
                            ReflectionTestUtils.setField(a, "id", 303L);
                            return a;
                        });

        ssoAccountService.findOrCreateSsoAccount(SsoProvider.KAKAO, info);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        assertThat(userCaptor.getValue().getNickname()).isEqualTo("둘째닉8888");
        verify(nicknameGenerator, times(2)).generate();
    }

    private static User user(long id, String nickname) {
        User user =
                User.builder()
                        .loginId("u" + id)
                        .password("p")
                        .name("n")
                        .nickname(nickname)
                        .email(id + "@t.com")
                        .phone("0100000" + String.format("%04d", id))
                        .role(UserRole.ROLE_USER)
                        .termsAgreed(true)
                        .privacyAgreed(true)
                        .build();
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }
}
