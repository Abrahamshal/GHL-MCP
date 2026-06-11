# Deployment

## Local Clone

```bash
npm install
npm run build
npm run start:stdio
```

## npx / Global Install

After publishing:

```bash
npx go-high-level-mcp-server ghl-mcp doctor
npm install -g go-high-level-mcp-server
ghl-mcp doctor
```

Publishing is manual. Verify first:

```bash
npm pack --dry-run
```

## Docker

```bash
docker compose up --build
```

Pass credentials through `.env`.

## Release Checklist

- Update changelog.
- Confirm semantic version.
- Run `npm run build`.
- Run `npm test`.
- Run `npm pack --dry-run`.
- Install from the tarball in a temp directory.

