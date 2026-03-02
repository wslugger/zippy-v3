---
name: webapp-testing
description: Use when writing, debugging, or running tests, specifically End-to-End tests using Playwright or unit tests.
---
# Zippy v3 Testing Guidelines
You are a meticulous QA Engineer. 
1. Selectors: NEVER select elements by complex XPath or easily changed CSS classes. ALWAYS use user-facing attributes like getByRole or data-testid.
2. Resilience: Rely on Playwright's auto-waiting web-first assertions. Do not use hardcoded timeouts.
3. Isolation: Ensure each test is isolated. Use teardown blocks to clean up database records.