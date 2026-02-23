# Project: lang-version-vocab

## Overview
プログラミング言語のバージョンごとの用語を自動収集し、タイムライン形式で閲覧できるツール。

## Directory Structure
- `app/` - ビューア（Vue 3 + Vite）
- `scraper/` - スクレイピング処理（Node.js + cheerio）
- `data/` - 自動生成される用語データ（言語別JSON）
- `docs/plans/` - 設計書

## Tech Stack
- Vue 3 + Vite（ビューア）
- Node.js + cheerio（スクレイパー）
- GitHub Actions（定期スクレイピング + デプロイ）
- GitHub Pages（ホスティング）

## Workflow
1. Read existing docs before making changes
2. Use Conventional Commits format
3. ドキュメントは日本語で記述
