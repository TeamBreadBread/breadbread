package com.breadbread.community.service;

import com.breadbread.community.dto.CommentListResponse;
import com.breadbread.community.dto.CommentResponse;
import com.breadbread.community.dto.CreateCommentRequest;
import com.breadbread.community.dto.CreatePostRequest;
import com.breadbread.community.dto.PostDetailResponse;
import com.breadbread.community.dto.PostListResponse;
import com.breadbread.community.dto.PostSearch;
import com.breadbread.community.dto.PostSummaryResponse;
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
import java.util.Arrays;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CommunityService {

    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final PostLikeRepository postLikeRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public PostListResponse findAll(List<PostType> postTypes, String keyword, int page, int size) {
        PostSearch search =
                PostSearch.builder()
                        .postTypes(
                                postTypes == null || postTypes.isEmpty()
                                        ? Arrays.asList(PostType.values())
                                        : postTypes)
                        .keyword(keyword)
                        .build();

        Page<Post> result = postRepository.searchPosts(search, PageRequest.of(page, size));
        List<PostSummaryResponse> posts =
                result.getContent().stream()
                        .map(
                                post -> {
                                    int likeCount =
                                            (int) postLikeRepository.countByPostId(post.getId());
                                    int commentCount =
                                            (int) commentRepository.countByPostId(post.getId());
                                    return PostSummaryResponse.from(post, likeCount, commentCount);
                                })
                        .toList();

        log.debug(
                "게시글 목록 조회: postTypes={}, keyword={}, total={}",
                postTypes,
                keyword,
                result.getTotalElements());
        return PostListResponse.from(result, posts);
    }

    @Transactional
    public Long createPost(Long userId, UserRole role, CreatePostRequest request) {
        if ((request.getPostType() == PostType.NOTICE || request.getPostType() == PostType.ARTICLE)
                && role != UserRole.ROLE_ADMIN) {
            throw new CustomException(ErrorCode.FORBIDDEN);
        }

        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        Post post =
                postRepository.save(
                        Post.builder()
                                .title(request.getTitle())
                                .content(request.getContent())
                                .postType(request.getPostType())
                                .imageUrls(request.getImageUrls())
                                .user(user)
                                .build());

        log.info(
                "게시글 작성: postId={}, userId={}, postType={}",
                post.getId(),
                userId,
                post.getPostType());
        return post.getId();
    }

    @Transactional(readOnly = true)
    public PostDetailResponse findOne(Long postId, Long userId) {
        log.debug("게시글 상세 조회: postId={}, userId={}", postId, userId);
        Post post =
                postRepository
                        .findById(postId)
                        .orElseThrow(() -> new CustomException(ErrorCode.POST_NOT_FOUND));
        boolean liked =
                userId != null && postLikeRepository.existsByUserIdAndPostId(userId, post.getId());
        int likeCount = (int) postLikeRepository.countByPostId(post.getId());
        CommentListResponse comments =
                CommentListResponse.from(
                        commentRepository.findAllByPostIdOrderByCreatedAtAsc(post.getId()), userId);
        return PostDetailResponse.from(post, userId, liked, likeCount, comments);
    }

    @Transactional
    public void updatePost(Long postId, Long userId, UserRole role, UpdatePostRequest request) {
        Post post =
                postRepository
                        .findById(postId)
                        .orElseThrow(() -> new CustomException(ErrorCode.POST_NOT_FOUND));
        validatePostAuthority(post, userId, role);
        post.update(request.getTitle(), request.getContent(), request.getImageUrls());

        log.info("게시글 수정: postId={}, userId={}", postId, userId);
    }

    @Transactional
    public void removePost(Long postId, Long userId, UserRole role) {
        Post post =
                postRepository
                        .findById(postId)
                        .orElseThrow(() -> new CustomException(ErrorCode.POST_NOT_FOUND));
        validatePostAuthority(post, userId, role);
        postRepository.delete(post);

        log.info("게시글 삭제: postId={}, userId={}", postId, userId);
    }

    @Transactional
    public CommentResponse createComment(Long postId, Long userId, CreateCommentRequest request) {
        Post post =
                postRepository
                        .findById(postId)
                        .orElseThrow(() -> new CustomException(ErrorCode.POST_NOT_FOUND));
        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        Comment comment =
                commentRepository.save(
                        Comment.builder()
                                .content(request.getContent())
                                .post(post)
                                .user(user)
                                .build());

        log.info("댓글 작성: commentId={}, postId={}, userId={}", comment.getId(), postId, userId);
        return CommentResponse.from(comment, userId);
    }

    @Transactional
    public void updateComment(
            Long postId, Long commentId, Long userId, UserRole role, UpdateCommentRequest request) {
        Comment comment =
                commentRepository
                        .findByIdAndPostId(commentId, postId)
                        .orElseThrow(() -> new CustomException(ErrorCode.COMMENT_NOT_FOUND));

        if (role != UserRole.ROLE_ADMIN && !comment.getUser().getId().equals(userId)) {
            throw new CustomException(ErrorCode.COMMENT_AUTHOR_ONLY);
        }

        comment.update(request.getContent());
        log.info("댓글 수정: commentId={}, postId={}, userId={}", commentId, postId, userId);
    }

    @Transactional
    public void removeComment(Long postId, Long commentId, Long userId, UserRole role) {
        Comment comment =
                commentRepository
                        .findByIdAndPostId(commentId, postId)
                        .orElseThrow(() -> new CustomException(ErrorCode.COMMENT_NOT_FOUND));

        if (role != UserRole.ROLE_ADMIN && !comment.getUser().getId().equals(userId)) {
            throw new CustomException(ErrorCode.COMMENT_AUTHOR_ONLY);
        }

        commentRepository.delete(comment);
        log.info("댓글 삭제: commentId={}, postId={}, userId={}", commentId, postId, userId);
    }

    @Transactional
    public void likePost(Long postId, Long userId) {
        Post post =
                postRepository
                        .findById(postId)
                        .orElseThrow(() -> new CustomException(ErrorCode.POST_NOT_FOUND));
        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        if (postLikeRepository.existsByUserIdAndPostId(userId, postId)) {
            throw new CustomException(ErrorCode.ALREADY_POST_LIKED);
        }

        try {
            postLikeRepository.save(PostLike.builder().post(post).user(user).build());
        } catch (DataIntegrityViolationException e) {
            throw new CustomException(ErrorCode.ALREADY_POST_LIKED);
        }

        log.info("게시글 좋아요: postId={}, userId={}", postId, userId);
    }

    @Transactional
    public void unlikePost(Long postId, Long userId) {
        PostLike like =
                postLikeRepository
                        .findByUserIdAndPostId(userId, postId)
                        .orElseThrow(() -> new CustomException(ErrorCode.NOT_POST_LIKED));
        postLikeRepository.delete(like);
        log.info("게시글 좋아요 취소: postId={}, userId={}", postId, userId);
    }

    private void validatePostAuthority(Post post, Long userId, UserRole role) {
        if (role == UserRole.ROLE_ADMIN) {
            return;
        }
        if (!post.getUser().getId().equals(userId)) {
            throw new CustomException(ErrorCode.POST_AUTHOR_ONLY);
        }
    }
}
