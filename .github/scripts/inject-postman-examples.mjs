/**
 * openapi-to-postmanv2는 OpenAPI response examples를 Postman saved response로 변환하지 않음.
 * Postman Mock Server는 saved response가 있어야 실제 예시 데이터를 반환함.
 * 이 스크립트는 변환된 collection의 response 예시를 saved response로 승격시킴.
 * js-yaml 의존성 없이 Node.js 내장만 사용.
 */

import { readFileSync, writeFileSync } from 'fs';

// openapi-to-postmanv2가 생성한 collection을 읽어서
// responses 배열에 example body를 saved response로 주입
const collection = JSON.parse(readFileSync('/tmp/collection.json', 'utf8'));

// openapi.yaml을 직접 파싱 (js-yaml 없이 간단한 방법: JSON으로 변환된 버전 사용)
// openapi-to-postmanv2는 변환 시 examples를 item.response[]로 넣지 않으므로
// openapi.yaml을 텍스트로 읽어 정규식으로 examples 블록 추출하는 대신,
// 별도 JSON 파일로 미리 변환해서 읽음

// workflow에서 `node --input-type=module` 대신 openapi를 JSON으로 먼저 변환하도록
// yaml → json 변환을 workflow step에서 처리하고 여기서는 JSON만 읽음
const openapi = JSON.parse(readFileSync('/tmp/openapi.json', 'utf8'));

const exampleMap = new Map();
for (const [path, pathItem] of Object.entries(openapi.paths ?? {})) {
  for (const [method, operation] of Object.entries(pathItem)) {
    if (!['get', 'post', 'put', 'patch', 'delete'].includes(method)) continue;
    for (const [statusCode, response] of Object.entries(operation.responses ?? {})) {
      const content = response.content?.['application/json'];
      if (!content) continue;
      const examples = content.examples ?? (content.example ? { default: { value: content.example } } : null);
      if (examples) {
        exampleMap.set(`${method.toUpperCase()} ${path}`, { statusCode, examples });
      }
    }
  }
}

const STATUS_TEXT = { 200: 'OK', 201: 'Created', 204: 'No Content' };

function urlPathToOpenApiPath(urlPath) {
  return '/' + urlPath.map(seg => seg.startsWith(':') ? `{${seg.slice(1)}}` : seg).join('/');
}

function processItems(items) {
  for (const item of items) {
    if (item.item) {
      processItems(item.item);
      continue;
    }
    if (!item.request) continue;

    const method = item.request.method;
    const urlPath = item.request.url?.path;
    if (!urlPath) continue;

    const openApiPath = urlPathToOpenApiPath(urlPath);
    const key = `${method} ${openApiPath}`;
    const exampleData = exampleMap.get(key);
    if (!exampleData) continue;

    const { statusCode, examples } = exampleData;
    const code = parseInt(statusCode);

    item.response = [];
    for (const [name, example] of Object.entries(examples)) {
      item.response.push({
        name,
        originalRequest: item.request,
        status: STATUS_TEXT[code] ?? 'OK',
        code,
        header: [{ key: 'Content-Type', value: 'application/json' }],
        body: JSON.stringify(example.value, null, 2),
        _postman_previewlanguage: 'json',
      });
    }
  }
}

processItems(collection.item);
writeFileSync('/tmp/collection.json', JSON.stringify(collection, null, 2));
console.log(`Injected saved responses for ${exampleMap.size} endpoints`);
