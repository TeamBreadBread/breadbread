package com.breadbread.community.service;

import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.entity.BakeryTag;
import com.breadbread.bakery.entity.enums.BakeryStatus;
import com.breadbread.bakery.entity.enums.BakeryTagType;
import com.breadbread.bakery.repository.BakeryRepository;
import com.breadbread.bakery.repository.BakeryTagRepository;
import com.breadbread.community.dto.CommentListResponse;
import com.breadbread.community.dto.CommentResponse;
import com.breadbread.community.dto.CreateCommentRequest;
import com.breadbread.community.dto.CreatePostRequest;
import com.breadbread.community.dto.PostDetailResponse;
import com.breadbread.community.dto.PostListResponse;
import com.breadbread.community.dto.PostListSort;
import com.breadbread.community.dto.PostSearch;
import com.breadbread.community.dto.PostSummaryResponse;
import com.breadbread.community.dto.UpdateCommentRequest;
import com.breadbread.community.dto.UpdatePostRequest;
import com.breadbread.community.entity.Comment;
import com.breadbread.community.entity.Post;
import com.breadbread.community.entity.PostLike;
import com.breadbread.community.entity.PostType;
import com.breadbread.community.repository.CommentRepository;
import com.breadbread.community.repository.PostLikeRepository;
import com.breadbread.community.repository.PostRepository;
import com.breadbread.global.dto.UploadFolder;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.image.service.GcsService;
import com.breadbread.image.service.TempImageService;
import com.breadbread.user.entity.User;
import com.breadbread.user.entity.UserRole;
import com.breadbread.user.repository.UserRepository;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
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
    private final BakeryRepository bakeryRepository;
    private final BakeryTagRepository bakeryTagRepository;
    private final GcsService gcsService;
    private final TempImageService tempImageService;

    @Transactional(readOnly = true)
    public PostListResponse findAll(
            List<PostType> postTypes, String keyword, int page, int size, PostListSort sort) {
        PostListSort effectiveSort = sort != null ? sort : PostListSort.LATEST;
        PostSearch search =
                PostSearch.builder()
                        .postTypes(
                                postTypes == null || postTypes.isEmpty()
                                        ? Arrays.asList(PostType.values())
                                        : postTypes)
                        .keyword(keyword)
                        .sort(effectiveSort)
                        .build();

        Page<Post> result = postRepository.searchPosts(search, PageRequest.of(page, size));
        List<Long> postIds = result.getContent().stream().map(Post::getId).toList();

        Map<Long, Long> likeCountMap =
                toCountMap(postIds, postLikeRepository.countByPostIdIn(postIds));
        Map<Long, Long> commentCountMap =
                toCountMap(postIds, commentRepository.countByPostIdIn(postIds));

        List<PostSummaryResponse> posts =
                result.getContent().stream()
                        .map(post -> toSummaryResponse(post, likeCountMap, commentCountMap))
                        .toList();

        log.debug(
                "게시글 목록 조회: postTypes={}, keyword={}, sort={}, total={}",
                postTypes,
                keyword,
                effectiveSort,
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

        if (request.getBakeryId() == null
                && request.getBakeryTags() != null
                && !request.getBakeryTags().isEmpty()) {
            throw new CustomException(ErrorCode.TAG_REQUIRES_BAKERY);
        }

        Bakery bakery =
                request.getBakeryId() == null
                        ? null
                        : bakeryRepository
                                .findByIdAndActiveTrueAndStatus(
                                        request.getBakeryId(), BakeryStatus.APPROVED)
                                .orElseThrow(() -> new CustomException(ErrorCode.BAKERY_NOT_FOUND));

        if (bakery != null
                && request.getPostType() != PostType.FREE
                && request.getBakeryTags() != null
                && !request.getBakeryTags().isEmpty()) {
            throw new CustomException(ErrorCode.BAKERY_TAG_NOT_ALLOWED_POST_TYPE);
        }

        Post post =
                postRepository.save(
                        Post.builder()
                                .title(request.getTitle())
                                .content(request.getContent())
                                .postType(request.getPostType())
                                .imageUrls(request.getImageUrls())
                                .user(user)
                                .bakery(bakery)
                                .build());

        if (bakery != null && request.getBakeryTags() != null) {
            bakeryTagRepository.saveAll(
                    request.getBakeryTags().stream()
                            .distinct()
                            .map(
                                    tag ->
                                            BakeryTag.builder()
                                                    .bakery(bakery)
                                                    .tag(tag)
                                                    .sourceType("POST")
                                                    .sourceId(post.getId())
                                                    .build())
                            .toList());
        }

        tempImageService.consumeOwnedImages(userId, request.getImageUrls(), UploadFolder.posts);

        log.info(
                "게시글 작성: postId={}, userId={}, postType={}, bakeryId={}, bakeryTags={}",
                post.getId(),
                userId,
                post.getPostType(),
                request.getBakeryId(),
                request.getBakeryTags());
        return post.getId();
    }

    @Transactional(readOnly = true)
    public PostDetailResponse findOne(Long postId, Long userId) {
        log.debug("게시글 상세 조회: postId={}, userId={}", postId, userId);
        Post post =
                postRepository
                        .findByIdWithUser(postId)
                        .orElseThrow(() -> new CustomException(ErrorCode.POST_NOT_FOUND));
        boolean liked =
                userId != null && postLikeRepository.existsByUserIdAndPostId(userId, post.getId());
        int likeCount = (int) postLikeRepository.countByPostId(post.getId());
        CommentListResponse comments =
                CommentListResponse.from(
                        commentRepository.findAllByPostIdWithUserOrderByCreatedAtAsc(post.getId()),
                        userId);
        List<BakeryTagType> bakeryTags =
                bakeryTagRepository.findAllBySourceTypeAndSourceId("POST", post.getId()).stream()
                        .map(BakeryTag::getTag)
                        .toList();
        return PostDetailResponse.from(post, userId, liked, likeCount, comments, bakeryTags);
    }

    @Transactional
    public void updatePost(Long postId, Long userId, UserRole role, UpdatePostRequest request) {
        Post post =
                postRepository
                        .findByIdWithUser(postId)
                        .orElseThrow(() -> new CustomException(ErrorCode.POST_NOT_FOUND));
        validatePostAuthority(post, userId, role);
        List<String> previousImageUrls = List.copyOf(post.getImageUrls());
        if (request.getImageUrls() != null) {
            List<String> addedImageUrls =
                    request.getImageUrls().stream()
                            .filter(url -> !previousImageUrls.contains(url))
                            .toList();
            tempImageService.consumeOwnedImages(userId, addedImageUrls, UploadFolder.posts);
        }
        post.update(request.getTitle(), request.getContent(), request.getImageUrls());
        if (request.getImageUrls() != null) {
            previousImageUrls.stream()
                    .filter(url -> !request.getImageUrls().contains(url))
                    .forEach(gcsService::deleteQuietly);
        }

        if (request.getBakeryTags() != null) {
            if (post.getBakery() == null && !request.getBakeryTags().isEmpty()) {
                throw new CustomException(ErrorCode.TAG_REQUIRES_BAKERY);
            }
            syncBakeryTags("POST", postId, request.getBakeryTags(), post.getBakery());
        }

        log.info(
                "게시글 수정: postId={}, userId={}, bakeryTags={}",
                postId,
                userId,
                request.getBakeryTags());
    }

    @Transactional
    public void removePost(Long postId, Long userId, UserRole role) {
        Post post =
                postRepository
                        .findByIdWithUser(postId)
                        .orElseThrow(() -> new CustomException(ErrorCode.POST_NOT_FOUND));
        validatePostAuthority(post, userId, role);
        post.getImageUrls().forEach(gcsService::deleteQuietly);
        commentRepository.deactivateAllByPostId(postId);
        bakeryTagRepository.deleteAll(
                bakeryTagRepository.findAllBySourceTypeAndSourceId("POST", postId));
        post.deactivate();

        log.info("게시글 삭제: postId={}, userId={}", postId, userId);
    }

    @Transactional
    public CommentResponse createComment(Long postId, Long userId, CreateCommentRequest request) {
        Post post =
                postRepository
                        .findByIdAndActiveTrue(postId)
                        .orElseThrow(() -> new CustomException(ErrorCode.POST_NOT_FOUND));
        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        List<String> imageUrls =
                request.getImageUrls() != null ? request.getImageUrls() : List.of();
        tempImageService.consumeOwnedImages(userId, imageUrls, UploadFolder.posts);
        Comment comment =
                commentRepository.save(
                        Comment.builder()
                                .content(request.getContent())
                                .imageUrls(imageUrls)
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
                        .findByIdAndPostIdAndActiveTrue(commentId, postId)
                        .orElseThrow(() -> new CustomException(ErrorCode.COMMENT_NOT_FOUND));

        if (role != UserRole.ROLE_ADMIN && !comment.getUser().getId().equals(userId)) {
            throw new CustomException(ErrorCode.COMMENT_AUTHOR_ONLY);
        }

        if (request.getImageUrls() != null) {
            List<String> previousImageUrls = List.copyOf(comment.getImageUrls());
            List<String> addedImageUrls =
                    request.getImageUrls().stream()
                            .filter(url -> !previousImageUrls.contains(url))
                            .toList();
            tempImageService.consumeOwnedImages(userId, addedImageUrls, UploadFolder.posts);
            comment.update(request.getContent(), request.getImageUrls());
            previousImageUrls.stream()
                    .filter(url -> !request.getImageUrls().contains(url))
                    .forEach(gcsService::deleteQuietly);
        } else {
            comment.update(request.getContent(), null);
        }
        log.info("댓글 수정: commentId={}, postId={}, userId={}", commentId, postId, userId);
    }

    @Transactional
    public void removeComment(Long postId, Long commentId, Long userId, UserRole role) {
        Comment comment =
                commentRepository
                        .findByIdAndPostIdAndActiveTrue(commentId, postId)
                        .orElseThrow(() -> new CustomException(ErrorCode.COMMENT_NOT_FOUND));

        if (role != UserRole.ROLE_ADMIN && !comment.getUser().getId().equals(userId)) {
            throw new CustomException(ErrorCode.COMMENT_AUTHOR_ONLY);
        }

        comment.getImageUrls().forEach(gcsService::deleteQuietly);
        comment.deactivate();
        log.info("댓글 삭제: commentId={}, postId={}, userId={}", commentId, postId, userId);
    }

    @Transactional
    public void likePost(Long postId, Long userId) {
        Post post =
                postRepository
                        .findByIdAndActiveTrue(postId)
                        .orElseThrow(() -> new CustomException(ErrorCode.POST_NOT_FOUND));
        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        try {
            postLikeRepository.saveAndFlush(PostLike.builder().post(post).user(user).build());
        } catch (DataIntegrityViolationException e) {
            log.warn(
                    "[게시글 좋아요 중복 또는 무결성 위반] postId={}, userId={}, msg={}",
                    postId,
                    userId,
                    e.getMessage());
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

    private PostSummaryResponse toSummaryResponse(
            Post post, Map<Long, Long> likeCountMap, Map<Long, Long> commentCountMap) {
        return PostSummaryResponse.from(
                post,
                likeCountMap.getOrDefault(post.getId(), 0L).intValue(),
                commentCountMap.getOrDefault(post.getId(), 0L).intValue());
    }

    private Map<Long, Long> toCountMap(List<Long> ids, List<Object[]> rows) {
        if (ids.isEmpty()) return Map.of();
        return rows.stream().collect(Collectors.toMap(row -> (Long) row[0], row -> (Long) row[1]));
    }

    private void validatePostAuthority(Post post, Long userId, UserRole role) {
        if (role == UserRole.ROLE_ADMIN) {
            return;
        }
        if (!post.getUser().getId().equals(userId)) {
            throw new CustomException(ErrorCode.POST_AUTHOR_ONLY);
        }
    }

    private void syncBakeryTags(
            String sourceType, Long sourceId, List<BakeryTagType> requested, Bakery bakery) {
        List<BakeryTag> existing =
                bakeryTagRepository.findAllBySourceTypeAndSourceId(sourceType, sourceId);
        List<BakeryTagType> existingTypes = existing.stream().map(BakeryTag::getTag).toList();

        List<BakeryTagType> toAdd =
                requested.stream().distinct().filter(t -> !existingTypes.contains(t)).toList();
        List<BakeryTag> toRemove =
                existing.stream().filter(t -> !requested.contains(t.getTag())).toList();

        bakeryTagRepository.deleteAll(toRemove);
        if (bakery != null) {
            bakeryTagRepository.saveAll(
                    toAdd.stream()
                            .map(
                                    tag ->
                                            BakeryTag.builder()
                                                    .bakery(bakery)
                                                    .tag(tag)
                                                    .sourceType(sourceType)
                                                    .sourceId(sourceId)
                                                    .build())
                            .toList());
        }
    }
}
