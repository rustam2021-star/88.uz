export function getPostUrl(post) {
  return `/blog/${post.slug}/`;
}

export function getPostProduct(post, products) {
  return products.find((product) => product.slug === post.product_slug);
}

export function getPostImage(post, products) {
  return post.image || getPostProduct(post, products)?.main_image || "/assets/theme/assets/images/blog/blog-1.jpg";
}

export function getBlogCategories(posts) {
  return Object.entries(
    posts.reduce((acc, post) => {
      acc[post.category] = (acc[post.category] || 0) + 1;
      return acc;
    }, {})
  ).map(([title, count]) => ({ title, count }));
}
