import hashlib
import mimetypes
import re
import time
from collections import deque
from os.path import relpath
from pathlib import Path
from urllib.parse import unquote, urldefrag, urljoin, urlparse

import requests
from bs4 import BeautifulSoup


BASE_DIR = Path(__file__).resolve().parent
START_URL = "https://tfamerce.vercel.app/home-electronics.html"
OUTPUT_DIR = BASE_DIR / "reference_tfamerce_full"

TIMEOUT = 25
REQUEST_DELAY = 0.15
MAX_PAGES = 300
MAX_DEPTH = 4

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; 88uz-reference-analyzer/1.0)"
}

ASSET_EXTENSIONS = {
    ".css",
    ".js",
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".svg",
    ".ico",
    ".avif",
    ".woff",
    ".woff2",
    ".ttf",
    ".otf",
    ".eot",
    ".mp4",
    ".webm",
    ".mp3",
    ".wav",
    ".json",
    ".xml",
    ".txt",
    ".pdf",
}

HTML_EXTENSIONS = {"", ".html", ".htm", ".php", ".asp", ".aspx"}

session = requests.Session()
session.headers.update(HEADERS)

downloaded_assets: dict[str, Path] = {}
downloaded_pages: dict[str, Path] = {}

start_parsed = urlparse(START_URL)
ALLOWED_HOST = start_parsed.netloc


def normalize_url(url: str) -> str:
    url, _fragment = urldefrag(url)
    return url.strip()


def is_http_url(url: str) -> bool:
    parsed = urlparse(url)
    return parsed.scheme in ("http", "https")


def is_same_host(url: str) -> bool:
    parsed = urlparse(url)
    return parsed.netloc == ALLOWED_HOST


def skip_url(url: str) -> bool:
    url = url.strip()
    lower = url.lower()

    return (
        not url
        or lower.startswith("#")
        or lower.startswith("data:")
        or lower.startswith("mailto:")
        or lower.startswith("tel:")
        or lower.startswith("javascript:")
        or lower.startswith("whatsapp:")
        or lower.startswith("tg:")
    )


def safe_part(value: str) -> str:
    value = unquote(value)
    value = re.sub(r"[^a-zA-Z0-9._-]+", "-", value)
    return value.strip("-") or "file"


def has_asset_extension(url: str) -> bool:
    path = urlparse(url).path.lower()
    suffix = Path(path).suffix.lower()
    return suffix in ASSET_EXTENSIONS


def looks_like_html_page(url: str) -> bool:
    parsed = urlparse(url)
    suffix = Path(parsed.path).suffix.lower()

    if suffix in ASSET_EXTENSIONS:
        return False

    return suffix in HTML_EXTENSIONS


def local_page_path(url: str) -> Path:
    parsed = urlparse(url)
    path = parsed.path

    if not path or path.endswith("/"):
        path += "index.html"

    suffix = Path(path).suffix
    if not suffix:
        path = path.rstrip("/") + "/index.html"

    parts = [safe_part(p) for p in path.strip("/").split("/") if p]
    if not parts:
        parts = ["index.html"]

    if parsed.query:
        stem = Path(parts[-1]).stem
        suffix = Path(parts[-1]).suffix or ".html"
        qhash = hashlib.md5(parsed.query.encode()).hexdigest()[:8]
        parts[-1] = f"{stem}-{qhash}{suffix}"

    return OUTPUT_DIR / Path(*parts)


def local_asset_path(url: str) -> Path:
    parsed = urlparse(url)
    netloc = safe_part(parsed.netloc)
    path = parsed.path

    if not path or path.endswith("/"):
        path += "index"

    parts = [safe_part(p) for p in path.strip("/").split("/") if p]
    if not parts:
        parts = ["file"]

    if parsed.query:
        stem = Path(parts[-1]).stem
        suffix = Path(parts[-1]).suffix
        qhash = hashlib.md5(parsed.query.encode()).hexdigest()[:8]
        parts[-1] = f"{stem}-{qhash}{suffix}"

    return OUTPUT_DIR / "_assets" / netloc / Path(*parts)


def guess_extension_from_content_type(path: Path, content_type: str) -> Path:
    if path.suffix:
        return path

    content_type = content_type.split(";")[0].strip().lower()
    ext = mimetypes.guess_extension(content_type)

    if ext:
        return path.with_suffix(ext)

    return path


def make_relative(from_file: Path, to_file: Path) -> str:
    return relpath(to_file, start=from_file.parent).replace("\\", "/")


def fetch(url: str) -> requests.Response | None:
    try:
        print(f"GET {url}")
        response = session.get(url, timeout=TIMEOUT, allow_redirects=True)
        response.raise_for_status()
        time.sleep(REQUEST_DELAY)
        return response
    except Exception as exc:
        print(f"ERROR fetch {url}: {exc}")
        return None


def download_asset(url: str, base_url: str | None = None) -> Path | None:
    if base_url:
        url = urljoin(base_url, url)

    url = normalize_url(url)

    if skip_url(url) or not is_http_url(url):
        return None

    if url in downloaded_assets:
        return downloaded_assets[url]

    response = fetch(url)
    if not response:
        return None

    content_type = response.headers.get("Content-Type", "")
    path = local_asset_path(url)
    path = guess_extension_from_content_type(path, content_type)

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(response.content)

    downloaded_assets[url] = path

    if path.suffix.lower() == ".css" or "text/css" in content_type.lower():
        rewrite_css_assets(path, url)

    return path


def rewrite_css_assets(css_path: Path, css_url: str) -> None:
    text = css_path.read_text(encoding="utf-8", errors="ignore")

    def replace_url(match):
        raw = match.group(1).strip().strip("'\"")

        if skip_url(raw):
            return match.group(0)

        abs_url = urljoin(css_url, raw)
        local = download_asset(abs_url)

        if not local:
            return match.group(0)

        relative = make_relative(css_path, local)
        return f"url('{relative}')"

    text = re.sub(r"url\((.*?)\)", replace_url, text)

    def replace_import(match):
        raw = match.group(1).strip().strip("'\"")

        if skip_url(raw):
            return match.group(0)

        abs_url = urljoin(css_url, raw)
        local = download_asset(abs_url)

        if not local:
            return match.group(0)

        relative = make_relative(css_path, local)
        return f"@import url('{relative}')"

    text = re.sub(
        r"@import\s+(?:url\()?['\"]?([^'\"\);]+)['\"]?\)?",
        replace_import,
        text,
    )

    css_path.write_text(text, encoding="utf-8")


def rewrite_srcset(value: str, base_url: str, html_file: Path) -> str:
    result = []

    for part in value.split(","):
        original_part = part.strip()
        if not original_part:
            continue

        pieces = original_part.split()
        raw_url = pieces[0]
        descriptor = " ".join(pieces[1:])

        local = download_asset(raw_url, base_url)
        if local:
            new_url = make_relative(html_file, local)
            result.append(f"{new_url} {descriptor}".strip())
        else:
            result.append(original_part)

    return ", ".join(result)


def should_download_linked_page(abs_url: str) -> bool:
    if skip_url(abs_url):
        return False

    if not is_http_url(abs_url):
        return False

    if not is_same_host(abs_url):
        return False

    if not looks_like_html_page(abs_url):
        return False

    return True


def rewrite_html_and_collect_links(html: str, page_url: str, html_file: Path) -> list[str]:
    soup = BeautifulSoup(html, "lxml")
    discovered_pages = []

    asset_attrs = [
        ("link", "href"),
        ("script", "src"),
        ("img", "src"),
        ("source", "src"),
        ("video", "src"),
        ("audio", "src"),
        ("iframe", "src"),
        ("embed", "src"),
        ("object", "data"),
    ]

    for tag_name, attr in asset_attrs:
        for tag in soup.find_all(tag_name):
            raw = tag.get(attr)
            if not raw or skip_url(raw):
                continue

            if tag_name == "link":
                rel = " ".join(tag.get("rel", [])).lower()
                href_lower = raw.lower()

                allowed = (
                    "stylesheet" in rel
                    or "icon" in rel
                    or "preload" in rel
                    or "apple-touch-icon" in rel
                    or has_asset_extension(href_lower)
                )

                if not allowed:
                    continue

            local = download_asset(raw, page_url)
            if local:
                tag[attr] = make_relative(html_file, local)

    for tag in soup.find_all(["img", "source"]):
        srcset = tag.get("srcset")
        if srcset:
            tag["srcset"] = rewrite_srcset(srcset, page_url, html_file)

    for tag in soup.find_all(style=True):
        style_value = tag.get("style", "")

        def replace_inline_url(match):
            raw = match.group(1).strip().strip("'\"")

            if skip_url(raw):
                return match.group(0)

            local = download_asset(raw, page_url)
            if not local:
                return match.group(0)

            relative = make_relative(html_file, local)
            return f"url('{relative}')"

        tag["style"] = re.sub(r"url\((.*?)\)", replace_inline_url, style_value)

    for tag in soup.find_all("meta"):
        prop = (tag.get("property") or tag.get("name") or "").lower()
        if prop in ("og:image", "twitter:image", "twitter:image:src"):
            raw = tag.get("content")
            if raw and not skip_url(raw):
                local = download_asset(raw, page_url)
                if local:
                    tag["content"] = make_relative(html_file, local)

    for link in soup.find_all("a"):
        raw = link.get("href")
        if not raw or skip_url(raw):
            continue

        abs_url = normalize_url(urljoin(page_url, raw))

        if should_download_linked_page(abs_url):
            discovered_pages.append(abs_url)
            target_file = local_page_path(abs_url)
            link["href"] = make_relative(html_file, target_file)

    return str(soup), discovered_pages


def download_page(page_url: str) -> list[str]:
    page_url = normalize_url(page_url)

    if page_url in downloaded_pages:
        return []

    response = fetch(page_url)
    if not response:
        return []

    content_type = response.headers.get("Content-Type", "").lower()

    if "text/html" not in content_type and not page_url.lower().endswith((".html", ".htm", "/")):
        download_asset(page_url)
        return []

    html_file = local_page_path(page_url)
    html_file.parent.mkdir(parents=True, exist_ok=True)

    html, discovered = rewrite_html_and_collect_links(response.text, page_url, html_file)

    html_file.write_text(html, encoding="utf-8")
    downloaded_pages[page_url] = html_file

    print(f"SAVED PAGE: {html_file}")
    return discovered


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    queue = deque()
    queue.append((normalize_url(START_URL), 0))

    seen = set()

    while queue and len(downloaded_pages) < MAX_PAGES:
        url, depth = queue.popleft()

        if url in seen:
            continue

        seen.add(url)

        if depth > MAX_DEPTH:
            continue

        if not should_download_linked_page(url):
            continue

        discovered = download_page(url)

        for link in discovered:
            if link not in seen:
                queue.append((link, depth + 1))

    print("\nDONE")
    print(f"Pages downloaded: {len(downloaded_pages)}")
    print(f"Assets downloaded: {len(downloaded_assets)}")
    print(f"Output folder: {OUTPUT_DIR.resolve()}")
    print(f"Start page local path: {local_page_path(START_URL).resolve()}")


if __name__ == "__main__":
    main()
