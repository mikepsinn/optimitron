# Security

## Reporting Vulnerabilities

Email security@warondisease.org

## For Contributors

### Never Commit Secrets

The pre-commit hook blocks commits containing:
- API keys (AWS, OpenAI, Anthropic, Google, Slack, GitHub)
- JWT tokens
- Private keys
- Hardcoded passwords

### Use Environment Variables

```bash
cp .env.example .env
# Edit .env with your actual values
# .env is gitignored — it stays local
```

### Rules

1. **No credentials in code.** Use `process.env.WHATEVER`.
2. **No credentials in tests.** Mock API responses, don't hit real APIs.
3. **No credentials in CI configs.** Use GitHub Secrets.
4. **.env.example has placeholder values only** — never real keys.
5. **Pre-commit hook runs automatically.** Don't bypass with `--no-verify` unless you're sure.
