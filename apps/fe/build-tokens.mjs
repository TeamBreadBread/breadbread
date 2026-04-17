import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const tokens = JSON.parse(readFileSync(join(__dirname, 'src/tokens/tokens.json'), 'utf-8'))

const lines = ['/* Do not edit directly, this file was auto-generated. */', '@theme {']

// Colors: Wireframe(Temp)/Mode 1
const colorGroups = ['gray', 'red', 'green', 'blue']
for (const group of colorGroups) {
  const colors = tokens['Wireframe(Temp)/Mode 1']?.[group] ?? {}

  for (const [key, val] of Object.entries(colors)) {
    if (val.$type === 'color') {
      lines.push(`  --color-${group}-${key.replace(`${group}_`, '')}: ${val.$value};`)
    }
  }
}

// Border radius: radius/Mode 1
const radius = tokens['radius/Mode 1'] ?? {}
for (const [key, val] of Object.entries(radius)) {
  if (val.$type === 'number') {
    lines.push(`  --radius-${key.replace(/_/g, '-')}: ${val.$value}px;`)
  }
}

// Spacing: scaling/Mode 1
const spacing = tokens['scaling/Mode 1'] ?? {}
for (const [key, val] of Object.entries(spacing)) {
  if (val.$type === 'number') {
    lines.push(`  --spacing-${key.replace(/_/g, '-')}: ${val.$value}px;`)
  }
}

// Font family
lines.push(`  --font-sans: Pretendard, sans-serif;`)

// Font sizes: global.fontSize
const fontSizes = tokens.global?.fontSize ?? {}
for (const [key, val] of Object.entries(fontSizes)) {
  if (val.$type === 'fontSizes') {
    lines.push(`  --font-size-${key}: ${val.$value}px;`)
  }
}

// Letter spacing: global.letterSpacing
const letterSpacing = tokens.global?.letterSpacing ?? {}
for (const [key, val] of Object.entries(letterSpacing)) {
  if (val.$type === 'letterSpacing') {
    lines.push(`  --tracking-${key}: ${val.$value}px;`)
  }
}

// Font weights
const fontWeightMap = { regular: '400', medium: '500', bold: '700' }
for (const [key, weight] of Object.entries(fontWeightMap)) {
  lines.push(`  --font-weight-${key}: ${weight};`)
}

// Line heights: global.lineHeight
const lineHeights = tokens.global?.lineHeight ?? {}
for (const [key, val] of Object.entries(lineHeights)) {
  if (val.$type === 'lineHeights') {
    lines.push(`  --leading-${key.replace('height_', '')}: ${val.$value}px;`)
  }
}

// Box shadows: global.shadow_*
for (const [key, val] of Object.entries(tokens.global ?? {})) {
  if (val.$type === 'boxShadow') {
    const { x, y, blur, spread, color } = val.$value
    lines.push(`  --shadow-${key.replace('shadow_', '')}: ${x}px ${y}px ${blur}px ${spread}px ${color};`)
  }
}

// Typography: global + typography/Mode 1
const globalTypography = tokens.global ?? {}
for (const [key, val] of Object.entries(globalTypography)) {
  if (val.$type === 'typography') {
    const fontFamily = val.$value.fontFamily?.replaceAll('{fontFamily.pretendard}', '"Pretendard", sans-serif') || 'inherit'
    const fontWeight = val.$value.fontWeight?.includes('.regular') ? '400' : val.$value.fontWeight?.includes('.medium') ? '500' : val.$value.fontWeight?.includes('.bold') ? '700' : 'inherit'
    const fontSize = val.$value.fontSize?.match(/\{fontSize\.(\d+)\}/)?.[1] ? `var(--font-size-${val.$value.fontSize.match(/\{fontSize\.(\d+)\}/)[1]})` : 'inherit'
    const lineHeight = val.$value.lineHeight?.match(/\{lineHeight\.(height_\w+)\}/)?.[1] ? `var(--leading-${val.$value.lineHeight.match(/\{lineHeight\.(height_\w+)\}/)[1].replace('height_', '')})` : 'inherit'
    lines.push(`  --typo-${key}: ${fontSize} / ${lineHeight} ${fontWeight} ${fontFamily};`)
  }
}

const typographyMode = tokens['typography/Mode 1'] ?? {}
for (const [key, val] of Object.entries(typographyMode)) {
  if (val.$type === 'typography') {
    const fontFamily = val.$value.fontFamily?.replaceAll('{fontFamily.pretendard}', '"Pretendard", sans-serif') || 'inherit'
    const fontWeight = val.$value.fontWeight?.includes('.regular') ? '400' : val.$value.fontWeight?.includes('.medium') ? '500' : val.$value.fontWeight?.includes('.bold') ? '700' : 'inherit'
    const fontSize = val.$value.fontSize?.match(/\{fontSize\.(size_\w+)\}/)?.[1] ? `var(--font-size-${val.$value.fontSize.match(/\{fontSize\.(size_\w+)\}/)[1]})` : 'inherit'
    const lineHeight = val.$value.lineHeight?.match(/\{lineHeight\.(height_\w+)\}/)?.[1] ? `var(--leading-${val.$value.lineHeight.match(/\{lineHeight\.(height_\w+)\}/)[1].replace('height_', '')})` : 'inherit'
    lines.push(`  --typo-${key}: ${fontSize} / ${lineHeight} ${fontWeight} ${fontFamily};`)
  }
}

lines.push('}')

const output = lines.join('\n') + '\n'
writeFileSync(join(__dirname, 'src/tokens.css'), output)
console.log(`Generated src/tokens.css (${lines.length - 3} tokens)`)
