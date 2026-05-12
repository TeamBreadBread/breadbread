package com.breadbread.community.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.breadbread.community.dto.CreateCommentRequest;
import com.breadbread.community.dto.CreatePostRequest;
import com.breadbread.community.dto.PostSearch;
import com.breadbread.community.dto.UpdateCommentRequest;
import com.breadbread.community.dto.UpdatePostRequest;
import com.breadbread.community.entity.Comment;
import com.breadbread.community.entity.Post;
import com.breadbread.community.entity.PostLike;
import com.breadbread.community.entity.PostType;
import com.breadbread.community.respository.CommentRepository;
import com.breadbread.community.respository.PostLikeRepository;
import com.breadbread.community.respository.PostRepository;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.user.entity.User;
import com.breadbread.user.entity.UserRole;
import com.breadbread.user.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class CommunityServiceTest {

    @Mock private PostRepository postRepository;
    @Mock private CommentRepository commentRepository;
    @Mock private PostLikeRepository postLikeRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks private CommunityService communityService;

    @Test
    void findAll_maps_like_and_comment_counts_when_posts_exist() {
        User author = user(1L);
        Post post = post(10L, "제목", PostType.FREE, author, List.of("https://img/1.jpg"));
        ReflectionTestUtils.setField(post, "createdAt", LocalDateTime.of(2026, 1, 2, 12, 0));
        when(postRepository.searchPosts(any(PostSearch.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(post), PageRequest.of(0, 10), 1));
        when(postLikeRepository.countByPostIdIn(List.of(10L)))
                .thenReturn(List.<Object[]>of(new Object[] {10L, 4L}));
        when(commentRepository.countByPostIdIn(List.of(10L)))
                .thenReturn(List.<Object[]>of(new Object[] {10L, 2L}));

        var response = communityService.findAll(null, null, 0, 10);

        assertThat(response.getTotal()).isEqualTo(1);
        assertThat(response.getPosts()).hasSize(1);
        assertThat(response.getPosts().get(0).getLikeCount()).isEqualTo(4);
        assertThat(response.getPosts().get(0).getCommentCount()).isEqualTo(2);
        assertThat(response.getPosts().get(0).getThumbnailImageUrl())
                .isEqualTo("https://img/1.jpg");
    }

    @Test
    void findAll_uses_all_post_types_when_filter_null_or_empty() {
        ArgumentCaptor<PostSearch> searchCaptor = ArgumentCaptor.forClass(PostSearch.class);
        when(postRepository.searchPosts(searchCaptor.capture(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 5), 0));

        communityService.findAll(null, "키워드", 0, 5);

        assertThat(searchCaptor.getValue().getPostTypes())
                .containsExactlyInAnyOrder(PostType.values());
        assertThat(searchCaptor.getValue().getKeyword()).isEqualTo("키워드");
    }

    @Test
    void findAll_uses_provided_post_types_when_filter_given() {
        ArgumentCaptor<PostSearch> searchCaptor = ArgumentCaptor.forClass(PostSearch.class);
        when(postRepository.searchPosts(searchCaptor.capture(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 5), 0));

        communityService.findAll(List.of(PostType.NOTICE), null, 0, 5);

        assertThat(searchCaptor.getValue().getPostTypes()).containsExactly(PostType.NOTICE);
    }

    @Test
    void createPost_throws_when_notice_and_role_not_admin() {
        CreatePostRequest request = createPostRequest("공지", "내용", PostType.NOTICE, null);

        assertThatThrownBy(() -> communityService.createPost(1L, UserRole.ROLE_USER, request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.FORBIDDEN);

        verify(postRepository, never()).save(any(Post.class));
    }

    @Test
    void createPost_throws_when_article_and_role_not_admin() {
        CreatePostRequest request = createPostRequest("칼럼", "내용", PostType.ARTICLE, null);

        assertThatThrownBy(() -> communityService.createPost(1L, UserRole.ROLE_BUSINESS, request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.FORBIDDEN);
    }

    @Test
    void createPost_throws_when_user_missing() {
        CreatePostRequest request = createPostRequest("글", "내용", PostType.FREE, null);
        when(userRepository.findById(9L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> communityService.createPost(9L, UserRole.ROLE_USER, request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.USER_NOT_FOUND);
    }

    @Test
    void createPost_returns_id_when_free_and_user_exists() {
        User author = user(2L);
        CreatePostRequest request =
                createPostRequest("자유", "본문", PostType.FREE, List.of("https://a.jpg"));
        when(userRepository.findById(2L)).thenReturn(Optional.of(author));
        when(postRepository.save(any(Post.class)))
                .thenAnswer(
                        inv -> {
                            Post p = inv.getArgument(0);
                            ReflectionTestUtils.setField(p, "id", 100L);
                            return p;
                        });

        Long id = communityService.createPost(2L, UserRole.ROLE_USER, request);

        assertThat(id).isEqualTo(100L);
        ArgumentCaptor<Post> postCaptor = ArgumentCaptor.forClass(Post.class);
        verify(postRepository).save(postCaptor.capture());
        assertThat(postCaptor.getValue().getTitle()).isEqualTo("자유");
        assertThat(postCaptor.getValue().getPostType()).isEqualTo(PostType.FREE);
        assertThat(postCaptor.getValue().getUser()).isSameAs(author);
    }

    @Test
    void createPost_returns_id_when_notice_and_admin() {
        User admin = user(3L);
        CreatePostRequest request = createPostRequest("공지", "내용", PostType.NOTICE, null);
        when(userRepository.findById(3L)).thenReturn(Optional.of(admin));
        when(postRepository.save(any(Post.class)))
                .thenAnswer(
                        inv -> {
                            Post p = inv.getArgument(0);
                            ReflectionTestUtils.setField(p, "id", 200L);
                            return p;
                        });

        Long id = communityService.createPost(3L, UserRole.ROLE_ADMIN, request);

        assertThat(id).isEqualTo(200L);
    }

    @Test
    void findOne_throws_when_post_missing() {
        when(postRepository.findByIdWithUser(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> communityService.findOne(1L, 10L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.POST_NOT_FOUND);
    }

    @Test
    void findOne_sets_liked_when_user_already_liked() {
        User author = user(5L);
        Post post = post(50L, "글", PostType.FREE, author, List.of());
        ReflectionTestUtils.setField(post, "createdAt", LocalDateTime.now());
        when(postRepository.findByIdWithUser(50L)).thenReturn(Optional.of(post));
        when(postLikeRepository.existsByUserIdAndPostId(10L, 50L)).thenReturn(true);
        when(postLikeRepository.countByPostId(50L)).thenReturn(3L);
        when(commentRepository.findAllByPostIdWithUserOrderByCreatedAtAsc(50L))
                .thenReturn(List.of());

        var detail = communityService.findOne(50L, 10L);

        assertThat(detail.isLiked()).isTrue();
        assertThat(detail.getLikeCount()).isEqualTo(3);
        assertThat(detail.isAuthor()).isFalse();
    }

    @Test
    void findOne_marks_author_when_viewer_is_owner() {
        User author = user(11L);
        Post post = post(60L, "글", PostType.FREE, author, List.of());
        ReflectionTestUtils.setField(post, "createdAt", LocalDateTime.now());
        when(postRepository.findByIdWithUser(60L)).thenReturn(Optional.of(post));
        when(postLikeRepository.existsByUserIdAndPostId(11L, 60L)).thenReturn(false);
        when(postLikeRepository.countByPostId(60L)).thenReturn(0L);
        when(commentRepository.findAllByPostIdWithUserOrderByCreatedAtAsc(60L))
                .thenReturn(List.of());

        var detail = communityService.findOne(60L, 11L);

        assertThat(detail.isAuthor()).isTrue();
    }

    @Test
    void updatePost_throws_when_not_author_nor_admin() {
        User owner = user(1L);
        User other = user(2L);
        Post post = post(7L, "t", PostType.FREE, owner, List.of());
        when(postRepository.findByIdWithUser(7L)).thenReturn(Optional.of(post));

        assertThatThrownBy(
                        () ->
                                communityService.updatePost(
                                        7L,
                                        other.getId(),
                                        UserRole.ROLE_USER,
                                        new UpdatePostRequest()))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.POST_AUTHOR_ONLY);
    }

    @Test
    void updatePost_updates_when_author_matches() {
        User owner = user(1L);
        Post post = post(7L, "old", PostType.FREE, owner, List.of());
        when(postRepository.findByIdWithUser(7L)).thenReturn(Optional.of(post));
        UpdatePostRequest req = new UpdatePostRequest();
        ReflectionTestUtils.setField(req, "title", "new-title");
        ReflectionTestUtils.setField(req, "content", "new-body");
        ReflectionTestUtils.setField(req, "imageUrls", List.of("https://x.jpg"));

        communityService.updatePost(7L, owner.getId(), UserRole.ROLE_USER, req);

        assertThat(post.getTitle()).isEqualTo("new-title");
        assertThat(post.getContent()).isEqualTo("new-body");
        assertThat(post.getImageUrls()).containsExactly("https://x.jpg");
    }

    @Test
    void updatePost_updates_when_admin_even_if_not_author() {
        User owner = user(1L);
        Post post = post(8L, "t", PostType.FREE, owner, List.of());
        when(postRepository.findByIdWithUser(8L)).thenReturn(Optional.of(post));
        UpdatePostRequest req = new UpdatePostRequest();
        ReflectionTestUtils.setField(req, "title", "admin-edit");

        communityService.updatePost(8L, 99L, UserRole.ROLE_ADMIN, req);

        assertThat(post.getTitle()).isEqualTo("admin-edit");
    }

    @Test
    void removePost_deletes_when_author() {
        User owner = user(1L);
        Post post = post(9L, "t", PostType.FREE, owner, List.of());
        when(postRepository.findByIdWithUser(9L)).thenReturn(Optional.of(post));

        communityService.removePost(9L, owner.getId(), UserRole.ROLE_USER);

        verify(postRepository).delete(post);
    }

    @Test
    void removePost_deletes_when_admin() {
        User owner = user(1L);
        Post post = post(9L, "t", PostType.FREE, owner, List.of());
        when(postRepository.findByIdWithUser(9L)).thenReturn(Optional.of(post));

        communityService.removePost(9L, 50L, UserRole.ROLE_ADMIN);

        verify(postRepository).delete(post);
    }

    @Test
    void createComment_throws_when_post_missing() {
        when(postRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> communityService.createComment(1L, 2L, commentRequest("내용")))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.POST_NOT_FOUND);
    }

    @Test
    void createComment_throws_when_user_missing() {
        Post post = post(1L, "t", PostType.FREE, user(3L), List.of());
        when(postRepository.findById(1L)).thenReturn(Optional.of(post));
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> communityService.createComment(1L, 99L, commentRequest("c")))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.USER_NOT_FOUND);
    }

    @Test
    void createComment_returns_response_when_ok() {
        User author = user(4L);
        Post post = post(2L, "t", PostType.FREE, user(3L), List.of());
        when(postRepository.findById(2L)).thenReturn(Optional.of(post));
        when(userRepository.findById(4L)).thenReturn(Optional.of(author));
        Comment saved = Comment.builder().content("댓글").post(post).user(author).build();
        ReflectionTestUtils.setField(saved, "id", 77L);
        ReflectionTestUtils.setField(saved, "createdAt", LocalDateTime.of(2026, 3, 1, 10, 0));
        when(commentRepository.save(any(Comment.class))).thenReturn(saved);

        var res = communityService.createComment(2L, 4L, commentRequest("댓글"));

        assertThat(res.getId()).isEqualTo(77L);
        assertThat(res.getContent()).isEqualTo("댓글");
        assertThat(res.isAuthor()).isTrue();
    }

    @Test
    void updateComment_throws_when_comment_missing() {
        when(commentRepository.findByIdAndPostId(5L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(
                        () ->
                                communityService.updateComment(
                                        1L,
                                        5L,
                                        10L,
                                        UserRole.ROLE_USER,
                                        new UpdateCommentRequest()))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.COMMENT_NOT_FOUND);
    }

    @Test
    void updateComment_throws_when_not_author_nor_admin() {
        User author = user(1L);
        User other = user(2L);
        Post post = post(1L, "t", PostType.FREE, author, List.of());
        Comment comment = Comment.builder().content("c").post(post).user(author).build();
        ReflectionTestUtils.setField(comment, "id", 5L);
        when(commentRepository.findByIdAndPostId(5L, 1L)).thenReturn(Optional.of(comment));
        UpdateCommentRequest req = new UpdateCommentRequest();
        ReflectionTestUtils.setField(req, "content", "x");

        assertThatThrownBy(
                        () ->
                                communityService.updateComment(
                                        1L, 5L, other.getId(), UserRole.ROLE_USER, req))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.COMMENT_AUTHOR_ONLY);
    }

    @Test
    void updateComment_updates_when_author() {
        User author = user(1L);
        Post post = post(1L, "t", PostType.FREE, author, List.of());
        Comment comment = Comment.builder().content("old").post(post).user(author).build();
        ReflectionTestUtils.setField(comment, "id", 5L);
        when(commentRepository.findByIdAndPostId(5L, 1L)).thenReturn(Optional.of(comment));
        UpdateCommentRequest req = new UpdateCommentRequest();
        ReflectionTestUtils.setField(req, "content", "new-c");

        communityService.updateComment(1L, 5L, author.getId(), UserRole.ROLE_USER, req);

        assertThat(comment.getContent()).isEqualTo("new-c");
    }

    @Test
    void removeComment_deletes_when_admin() {
        User author = user(1L);
        Post post = post(1L, "t", PostType.FREE, author, List.of());
        Comment comment = Comment.builder().content("c").post(post).user(author).build();
        ReflectionTestUtils.setField(comment, "id", 5L);
        when(commentRepository.findByIdAndPostId(5L, 1L)).thenReturn(Optional.of(comment));

        communityService.removeComment(1L, 5L, 99L, UserRole.ROLE_ADMIN);

        verify(commentRepository).delete(comment);
    }

    @Test
    void likePost_throws_when_already_liked() {
        Post post = post(1L, "t", PostType.FREE, user(1L), List.of());
        when(postRepository.findById(1L)).thenReturn(Optional.of(post));
        when(userRepository.findById(2L)).thenReturn(Optional.of(user(2L)));
        when(postLikeRepository.existsByUserIdAndPostId(2L, 1L)).thenReturn(true);

        assertThatThrownBy(() -> communityService.likePost(1L, 2L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.ALREADY_POST_LIKED);

        verify(postLikeRepository, never()).save(any(PostLike.class));
    }

    @Test
    void likePost_maps_integrity_violation_when_race_on_save() {
        Post post = post(1L, "t", PostType.FREE, user(1L), List.of());
        when(postRepository.findById(1L)).thenReturn(Optional.of(post));
        when(userRepository.findById(2L)).thenReturn(Optional.of(user(2L)));
        when(postLikeRepository.existsByUserIdAndPostId(2L, 1L)).thenReturn(false);
        doThrow(new DataIntegrityViolationException("dup"))
                .when(postLikeRepository)
                .save(any(PostLike.class));

        assertThatThrownBy(() -> communityService.likePost(1L, 2L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.ALREADY_POST_LIKED);
    }

    @Test
    void unlikePost_throws_when_not_liked() {
        when(postLikeRepository.findByUserIdAndPostId(2L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> communityService.unlikePost(1L, 2L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.NOT_POST_LIKED);
    }

    @Test
    void unlikePost_deletes_when_like_exists() {
        Post post = post(1L, "t", PostType.FREE, user(1L), List.of());
        User liker = user(2L);
        PostLike like = PostLike.builder().post(post).user(liker).build();
        when(postLikeRepository.findByUserIdAndPostId(2L, 1L)).thenReturn(Optional.of(like));

        communityService.unlikePost(1L, 2L);

        verify(postLikeRepository).delete(like);
    }

    private static CreatePostRequest createPostRequest(
            String title, String content, PostType type, List<String> images) {
        CreatePostRequest r = new CreatePostRequest();
        ReflectionTestUtils.setField(r, "title", title);
        ReflectionTestUtils.setField(r, "content", content);
        ReflectionTestUtils.setField(r, "postType", type);
        ReflectionTestUtils.setField(r, "imageUrls", images);
        return r;
    }

    private static CreateCommentRequest commentRequest(String content) {
        CreateCommentRequest r = new CreateCommentRequest();
        ReflectionTestUtils.setField(r, "content", content);
        return r;
    }

    private static Post post(long id, String title, PostType type, User author, List<String> urls) {
        Post p =
                Post.builder()
                        .title(title)
                        .content("body")
                        .postType(type)
                        .user(author)
                        .imageUrls(urls)
                        .build();
        ReflectionTestUtils.setField(p, "id", id);
        return p;
    }

    private static User user(long id) {
        User u =
                User.builder()
                        .loginId("u" + id)
                        .password("p")
                        .name("n" + id)
                        .nickname("nick" + id)
                        .email(id + "@t.com")
                        .phone("0100000" + String.format("%04d", id))
                        .role(UserRole.ROLE_USER)
                        .termsAgreed(true)
                        .privacyAgreed(true)
                        .build();
        ReflectionTestUtils.setField(u, "id", id);
        return u;
    }
}
