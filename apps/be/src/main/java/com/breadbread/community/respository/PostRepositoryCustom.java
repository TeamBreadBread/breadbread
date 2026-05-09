package com.breadbread.community.respository;

import com.breadbread.community.dto.PostSearch;
import com.breadbread.community.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface PostRepositoryCustom {

    Page<Post> searchPosts(PostSearch search, Pageable pageable);
}
