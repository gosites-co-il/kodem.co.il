# @shared/interfaces

A shared TypeScript interface library for use across the Nx monorepo.

This library contains all common **types** and **interfaces** used in both the **Next.js frontend app** and the **Express backend app**, enabling consistent type safety and reducing duplication.

---
## How to create :
```
nx generate @nx/js:lib interfaces --directory=libs/shared --no-interactive

 ```

## 📦 Location

```
libs/shared/interfaces
```

---

## 📚 Purpose

Centralize all cross-app TypeScript interfaces such as:

- User models
- Request/response DTOs
- Shared enums and constants
- Configuration types
- Domain models (e.g., `Order`, `Product`, etc.)

---

## 🛠️ Usage

### In Next.js app

```ts
import { User } from '@shared/interfaces';
```

### In Express app

```ts
import { User } from '@shared/interfaces';
```

✅ Works with both server and client side code via Nx path aliases.

---

## ✍️ Adding New Interfaces

1. Create a new file inside `src/lib`, e.g., `order.interface.ts`.
2. Define your interface:

```ts
export interface Order {
  id: string;
  userId: string;
  total: number;
}
```

3. Export it from the main barrel file:

```ts
// src/index.ts
export * from './lib/order.interface';
```

---

## 🧪 Development Tips

- This library does not contain runtime code, only types.
- No build step is needed to use it in other Nx apps.
- Keep types generic and framework-agnostic.

---

## ✅ Linting & Module Boundaries

This lib is tagged as `scope:shared` and `type:interface` in `nx.json`.

Ensure other apps/libraries respect Nx dependency constraints.

---

## 👥 Contributors

- Backend and frontend developers
- System designers modeling domain types

---

## 📄 License

MIT – this library is part of the internal monorepo and follows its licensing rules.
