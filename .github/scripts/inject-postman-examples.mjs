/**
 * openapi-to-postmanv2는 OpenAPI response examples를 Postman saved response로 변환하지 않음.
 * Postman Mock Server는 saved response가 있어야 실제 예시 데이터를 반환함.
 * 이 스크립트는 OpenAPI examples를 읽어 Postman collection에 saved response로 주입함.
 */

import { readFileSync, writeFileSync } from 'fs';
import { load as yamlLoad } from 'js-yaml';

const openapi = yamlLoad(readFileSync('be/static/openapi.yaml', 'utf8'));
const collection = JSON.parse(readFileSync('/tmp/collection.json', 'utf8'));

// OpenAPI path+method → { statusCode, examples } 맵 구성
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
  // Postman: ['api', 'bakeries', ':id'] → /api/bakeries/{id}
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
