param(
  [ValidateSet('en', 'uz')]
  [string[]]$Languages = @('en', 'uz')
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$dataDir = Join-Path $root 'src\data'
$outputDir = Join-Path $dataDir 'i18n'
$cachePath = Join-Path $outputDir 'translation-cache.json'
$separator = "`n@@@88UZ@@@`n"

New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
$cache = @{}
$script:newTranslations = 0
if (Test-Path -LiteralPath $cachePath) {
  $cacheObject = Get-Content -Raw -Encoding UTF8 $cachePath | ConvertFrom-Json
  if ($cacheObject) {
    foreach ($property in $cacheObject.PSObject.Properties) { $cache[$property.Name] = $property.Value }
  }
}

function Get-Translation([string]$Text, [string]$Language) {
  if ([string]::IsNullOrWhiteSpace($Text)) { return $Text }
  $bytes = [Text.Encoding]::UTF8.GetBytes("$Language|$Text")
  $sha = [Security.Cryptography.SHA256]::Create()
  try { $key = ([BitConverter]::ToString($sha.ComputeHash($bytes))).Replace('-', '') } finally { $sha.Dispose() }
  if ($cache.ContainsKey($key)) { return [string]$cache[$key] }

  $query = [Uri]::EscapeDataString($Text)
  $url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=ru&tl=$Language&dt=t&q=$query"
  for ($attempt = 1; $attempt -le 4; $attempt++) {
    try {
      $response = Invoke-RestMethod -Uri $url -TimeoutSec 30
      $translated = (($response[0] | ForEach-Object { $_[0] }) -join '')
      if (-not [string]::IsNullOrWhiteSpace($translated)) {
        $cache[$key] = $translated
        $script:newTranslations++
        if (($script:newTranslations % 10) -eq 0) {
          $cacheJson = $cache | ConvertTo-Json -Depth 5
          [IO.File]::WriteAllText($cachePath, "$cacheJson`n", [Text.UTF8Encoding]::new($false))
        }
        return $translated
      }
    } catch {
      if ($attempt -eq 4) { throw }
      Start-Sleep -Milliseconds (500 * $attempt)
    }
  }
}

function Translate-Values([object[]]$Values, [string]$Language) {
  if (-not $Values -or $Values.Count -eq 0) { return @() }
  $translated = Get-Translation (($Values | ForEach-Object { [string]$_ }) -join $separator) $Language
  $parts = $translated -split [regex]::Escape($separator)
  if ($parts.Count -ne $Values.Count) {
    return @($Values | ForEach-Object { Get-Translation ([string]$_) $Language })
  }
  return @($parts)
}

function Write-Json([string]$Path, $Value) {
  $json = $Value | ConvertTo-Json -Depth 30
  [IO.File]::WriteAllText($Path, "$json`n", [Text.UTF8Encoding]::new($false))
}

$products = Get-Content -Raw -Encoding UTF8 (Join-Path $dataDir 'products.json') | ConvertFrom-Json
$categories = Get-Content -Raw -Encoding UTF8 (Join-Path $dataDir 'categories.json') | ConvertFrom-Json
$posts = Get-Content -Raw -Encoding UTF8 (Join-Path $dataDir 'blog.json') | ConvertFrom-Json

foreach ($language in $Languages) {
  Write-Host "Generating $language translations..."
  $productOutput = [ordered]@{}
  $index = 0
  foreach ($product in $products) {
    $index++
    Write-Host "  products $index/$($products.Count)" -NoNewline
    Write-Host "`r" -NoNewline
    $fields = @($product.title, $product.condition, $product.location, $product.short_description, $product.description, $product.seo_title, $product.seo_description)
    $translatedFields = @(Translate-Values $fields $language)
    $badges = @(Translate-Values @($product.badges) $language)
    $specNames = @($product.specs.PSObject.Properties.Name)
    $specValues = @($product.specs.PSObject.Properties.Value | ForEach-Object { [string]$_ })
    $translatedSpecNames = @(Translate-Values $specNames $language)
    $translatedSpecValues = @(Translate-Values $specValues $language)
    $specs = [ordered]@{}
    for ($i = 0; $i -lt $translatedSpecNames.Count; $i++) { $specs[$translatedSpecNames[$i]] = $translatedSpecValues[$i] }

    $productOutput[$product.slug] = [ordered]@{
      title = $translatedFields[0]
      condition = $translatedFields[1]
      location = $translatedFields[2]
      badges = $badges
      short_description = $translatedFields[3]
      description = $translatedFields[4]
      seo_title = $translatedFields[5]
      seo_description = $translatedFields[6]
      specs = $specs
    }
  }
  Write-Host "  products $($products.Count)/$($products.Count)"

  $categoryOutput = [ordered]@{}
  foreach ($category in $categories) {
    $fields = @($category.title, $category.quantity, $category.seo_title, $category.seo_description, $category.description_top, $category.description_bottom)
    $translated = @(Translate-Values $fields $language)
    $categoryOutput[$category.slug] = [ordered]@{
      title = $translated[0]; quantity = $translated[1]; seo_title = $translated[2]
      seo_description = $translated[3]; description_top = $translated[4]; description_bottom = $translated[5]
    }
  }

  $blogOutput = [ordered]@{}
  foreach ($post in $posts) {
    $scalarFields = @(Translate-Values @($post.category, $post.title, $post.excerpt) $language)
    $content = @(Translate-Values @($post.content) $language)
    $blogOutput[$post.slug] = [ordered]@{
      category = $scalarFields[0]; title = $scalarFields[1]; excerpt = $scalarFields[2]; content = $content
    }
  }

  Write-Json (Join-Path $outputDir "products.$language.json") $productOutput
  Write-Json (Join-Path $outputDir "categories.$language.json") $categoryOutput
  Write-Json (Join-Path $outputDir "blog.$language.json") $blogOutput
  Write-Json $cachePath $cache
}

Write-Host 'Translation files generated.'
