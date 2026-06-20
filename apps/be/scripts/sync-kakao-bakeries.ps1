param(
    [string]$BaseUrl = "https://api.breadbread.io",
    [string]$AdminJwt = $env:BREAD_ADMIN_JWT,
    [string]$AiApiKey = $env:AI_API_KEY
)

if (-not $AdminJwt -and -not $AiApiKey) {
    Write-Error "Set BREAD_ADMIN_JWT (admin Bearer token) or AI_API_KEY (X-AI-API-KEY)."
    exit 1
}

$headers = @{
    "Content-Type" = "application/json"
}
if ($AdminJwt) {
    $headers["Authorization"] = "Bearer $AdminJwt"
}
if ($AiApiKey) {
    $headers["X-AI-API-KEY"] = $AiApiKey
}

Write-Host "POST $BaseUrl/admin/bakeries/sync-kakao"
$response = curl.exe -s -X POST "$BaseUrl/admin/bakeries/sync-kakao" `
    -H "Content-Type: application/json" `
    $(if ($AdminJwt) { @("-H", "Authorization: Bearer $AdminJwt") }) `
    $(if ($AiApiKey) { @("-H", "X-AI-API-KEY: $AiApiKey") }) `
    -d "{}" `
    -w "`nHTTP:%{http_code}"

Write-Host $response
