# Nginx deployment

Install the site configuration and validate it before reloading:

```sh
sudo cp deploy/nginx/88.uz.conf /etc/nginx/sites-available/88.uz
sudo nginx -t
sudo systemctl reload nginx
```

The configuration permanently redirects all former unprefixed Russian page
URLs to `/ru/...`. Query strings are preserved. Unknown URLs return a real 404
instead of falling back to the home-page redirect document.

Quick checks:

```sh
curl -I https://88.uz/catalog/
curl -I 'https://88.uz/catalog/?q=test'
curl -I https://88.uz/product/example/
curl -I https://www.88.uz/uz/
curl -I https://88.uz/missing-page/
```

Expected results are `301` to the equivalent canonical URL for the first four
requests and `404` for the last request.
