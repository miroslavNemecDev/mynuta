# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

## Local development

Run `npm install`, copy `.env.example` to `.env`, and start the app with `npm run dev`.
Vite serves the existing `/api/subscribe` endpoint locally as well as the frontend.
Configure the SMTP values in `.env` to send real emails; without them, the endpoint
returns an error when a valid email address is submitted.

## 500-SKU mobile catalog test

Open `/?prototyp=obchod&test-katalog=500` while the Vite dev server is running to
load 500 synthetic products and a mobile-only horizontal sale carousel. Test
catalog products, carts, orders, and discount settings use separate browser
storage from the regular prototype. The generated prices, stock, and names are
fictional; product photos reuse the existing sample images.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
