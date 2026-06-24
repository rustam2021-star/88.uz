import hashlib
import mimetypes
import re
import time
from os.path import relpath
from pathlib import Path
from urllib.parse import unquote, urljoin, urlparse

import requests
from bs4 import BeautifulSoup


BASE_DIR = Path(__file__).resolve().parent
TARGET_URL = "https://tfamerce.vercel.app/home-electronics.html"
OUTPUT_DIR = BASE_DIR / "reference_tfamerce"
TIMEOUT = 20

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; 88uz-reference-analyzer/1.0)"
}

session = requests.Session()
session.headers.update(HEADERS)

downloaded = {}


def is_http_url(url: str) -> bool:
    parsed = urlparse(url)
    return parsed.scheme in ("http", "https")


def skip_url(url: str) -> bool:
    url = url.strip()
    return (
        not url
        or url.startswith("#")
        or url.startswith("data:")
        or url.startswith("mailto:")
        or url.startswith("tel:")
        or url.startswith("javascript:")
    )


def safe_part(value: str) -> str:
    value = unquote(value)
    value = re.sub(r"[^a-zA-Z0-9._-]+", "-", value)
    return value.strip("-") or "file"


def local_path_for_url(url: str) -> Path:
    parsed = urlparse(url)
    netloc = safe_part(parsed.netloc)
    path = parsed.path

    if not path or path.endswith("/"):
        path += "index.html"

    parts = [safe_part(part) for part in path.strip("/").split("/") if part]

    if not parts:
        parts = ["index.html"]

    if parsed.query:
        stem = Path(parts[-1]).stem
        suffix = Path(parts[-1]).suffix
        qhash = hashlib.md5(parsed.query.encode()).hexdigest()[:8]
        parts[-1] = f"{stem}-{qhash}{suffix}"

    return OUTPUT_DIR / "assets" / netloc / Path(*parts)


def guess_extension_from_content_type(path: Path, content_type: str) -> Path:
    if path.suffix:
        return path

    content_type = content_type.split(";")[0].strip()
    ext = mimetypes.guess_extension(content_type)

    if ext:
        return path.with_suffix(ext)

    return path


def make_relative(from_file: Path, to_file: Path) -> str:
    return relpath(to_file, start=from_file.parent).replace("\\", "/")


def download_file(url: str) -> Path | None:
    if skip_url(url) or not is_http_url(url):
        return None

    if url in downloaded:
        return downloaded[url]

    try:
        print(f"Downloading: {url}")
        response = session.get(url, timeout=TIMEOUT)
        response.raise_for_status()

        path = local_path_for_url(url)
        path = guess_extension_from_content_type(
            path,
            response.headers.get("Content-Type", ""),
        )

        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(response.content)

        downloaded[url] = path

        content_type = response.headers.get("Content-Type", "")
        if path.suffix.lower() == ".css" or "text/css" in content_type:
            rewrite_css_assets(path, url)

        time.sleep(0.15)
        return path
    except Exception as exc:
        print(f"ERROR downloading {url}: {exc}")
        return None


def rewrite_srcset(value: str, base_url: str, html_file: Path) -> str:
    result = []

    for part in value.split(","):
        original_part = part.strip()
        if not original_part:
            continue

        pieces = original_part.split()
        raw_url = pieces[0]
        descriptor = " ".join(pieces[1:])

        abs_url = urljoin(base_url, raw_url)
        local = download_file(abs_url)

        if local:
            new_url = make_relative(html_file, local)
            result.append(f"{new_url} {descriptor}".strip())
        else:
            result.append(original_part)

    return ", ".join(result)


def rewrite_asset_attr(tag, attr: str, base_url: str, html_file: Path) -> None:
    raw = tag.get(attr)
    if not raw or skip_url(raw):
        return

    abs_url = urljoin(base_url, raw)
    local = download_file(abs_url)

    if local:
        tag[attr] = make_relative(html_file, local)


def rewrite_css_assets(css_path: Path, css_url: str) -> None:
    text = css_path.read_text(encoding="utf-8", errors="ignore")

    def replace_url(match):
        raw = match.group(1).strip().strip("'\"")

        if skip_url(raw):
            return match.group(0)

        abs_url = urljoin(css_url, raw)
        local = download_file(abs_url)

        if not local:
            return match.group(0)

        relative = make_relative(css_path, local)
        return f"url('{relative}')"

    new_text = re.sub(r"url\((.*?)\)", replace_url, text)
    css_path.write_text(new_text, encoding="utf-8")


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    response = session.get(TARGET_URL, timeout=TIMEOUT)
    response.raise_for_status()

    html_file = OUTPUT_DIR / "index.html"
    soup = BeautifulSoup(response.text, "lxml")

    asset_attrs = [
        ("link", "href"),
        ("script", "src"),
        ("img", "src"),
        ("source", "src"),
        ("video", "src"),
        ("audio", "src"),
        ("iframe", "src"),
    ]

    for tag_name, attr in asset_attrs:
        for tag in soup.find_all(tag_name):
            raw = tag.get(attr)
            if not raw or skip_url(raw):
                continue

            if tag_name == "link":
                rel = " ".join(tag.get("rel", [])).lower()
                allowed_rels = ["stylesheet", "icon", "preload", "apple-touch-icon"]
                if not any(rel_name in rel for rel_name in allowed_rels):
                    continue

            rewrite_asset_attr(tag, attr, TARGET_URL, html_file)

    lazy_asset_attrs = ["data-src", "data-bg", "data-image"]
    for attr in lazy_asset_attrs:
        for tag in soup.find_all(attrs={attr: True}):
            rewrite_asset_attr(tag, attr, TARGET_URL, html_file)

    for tag in soup.find_all(["img", "source"]):
        srcset = tag.get("srcset")
        if srcset:
            tag["srcset"] = rewrite_srcset(srcset, TARGET_URL, html_file)

        data_srcset = tag.get("data-srcset")
        if data_srcset:
            tag["data-srcset"] = rewrite_srcset(data_srcset, TARGET_URL, html_file)

    html_file.write_text(str(soup), encoding="utf-8")

    print("\nDone.")
    print(f"Saved to: {OUTPUT_DIR.resolve()}")
    print(f"Open: {html_file.resolve()}")


if __name__ == "__main__":
    main()
