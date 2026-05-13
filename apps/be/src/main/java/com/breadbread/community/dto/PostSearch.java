package com.breadbread.community.dto;

import com.breadbread.community.entity.PostType;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PostSearch {
    List<PostType> postTypes;
    String keyword;

    @Builder.Default private PostListSort sort = PostListSort.LATEST;
}
