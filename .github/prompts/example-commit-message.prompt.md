---
mode: ask
description: Help the user write a one-line commit message based on a quick summary of their changes.
model: GPT-4o
tools: ['edit/createFile', 'edit/editFiles', 'changes']
---

<prompt id="generate-simple-commit-message">

## Commit Message Format

```
<type>[optional scope]: <description>
[optional body]
[optional footer(s)]
```

---

## Types

Each commit message communicates intent:

| Type              | Description                                                                      | SemVer Impact             |
| ----------------- | -------------------------------------------------------------------------------- | ------------------------- |
| `fix`             | Patches a bug in the codebase                                                    | **PATCH**                 |
| `feat`            | Introduces a new feature                                                         | **MINOR**                 |
| `BREAKING CHANGE` | Introduces a breaking API change (can appear in footer or with `!`)              | **MAJOR**                 |
| Other types       | e.g. `build:`, `chore:`, `ci:`, `docs:`, `style:`, `refactor:`, `perf:`, `test:` | No implicit SemVer effect |

---

## Optional Scope

A **scope** provides contextual information and is enclosed in parentheses:

```
feat(parser): add ability to parse arrays
```

---

## Breaking Changes

Breaking changes can be indicated in two ways:

1. With a `!` after type or scope:
   ```
   feat!: send an email to the customer when a product is shipped
   feat(api)!: update endpoint schema
   ```
2. With a `BREAKING CHANGE:` footer:
   ```
   BREAKING CHANGE: `extends` key in config file is now used for extending other config files
   ```

---

## Examples

### 1. Description and Breaking Change Footer

```
feat: allow provided config object to extend other configs

BREAKING CHANGE: `extends` key in config file is now used for extending other config files
```

### 2. Breaking Change with `!`

```
feat!: send an email to the customer when a product is shipped
```

### 3. Breaking Change with Scope

```
feat(api)!: send an email to the customer when a product is shipped
```

### 4. Both `!` and Footer

```
chore!: drop support for Node 6

BREAKING CHANGE: use JavaScript features not available in Node 6.
```

### 5. No Body

```
docs: correct spelling of CHANGELOG
```

### 6. With Scope

```
feat(lang): add Polish language
```

### 7. Multi-paragraph Body with Multiple Footers

```
fix: prevent racing of requests

Introduce a request id and a reference to latest request. Dismiss
incoming responses other than from latest request.

Remove timeouts which were used to mitigate the racing issue but are
obsolete now.

Reviewed-by: Z
Refs: #123
```

---

## Specification

The key words **“MUST”, “SHOULD”, “MAY”** etc. are as defined in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119).

1. Commits **MUST** be prefixed with a type, optionally followed by scope and/or `!`, then a colon and space.
2. The type `feat` **MUST** be used when a commit adds a feature.
3. The type `fix` **MUST** be used when a commit fixes a bug.
4. A **scope** MAY follow the type.  
   Example: `fix(parser): handle null inputs`
5. The **description** MUST follow the colon and space.  
   Example: `fix: array parsing issue when multiple spaces are contained in string.`
6. A **body** MAY follow the description, starting after one blank line.
7. The **body** MAY contain any number of paragraphs.
8. One or more **footers** MAY follow the body, separated by a blank line.
9. Each **footer** MUST have a token followed by `:` or ` #` and a value.  
   Example: `Reviewed-by: Alice`, `Refs: #123`
10. Footer tokens MUST use hyphens instead of spaces (e.g., `Acked-by`), except for `BREAKING CHANGE`.
11. A footer’s value MAY contain spaces and newlines. Parsing stops at the next valid footer.
12. Breaking changes MUST be indicated either with `!` or a `BREAKING CHANGE` footer.
13. `BREAKING CHANGE` footers MUST be uppercase and follow this format:
    ```
    BREAKING CHANGE: environment variables now take precedence over config files.
    ```
14. When `!` is used, `BREAKING CHANGE:` MAY be omitted; the description is treated as the breaking change.
15. Other types (e.g., `docs:`, `chore:`) MAY be used.
16. Commit units are case-insensitive, except `BREAKING CHANGE`, which MUST be uppercase.
17. `BREAKING-CHANGE` is synonymous with `BREAKING CHANGE` in footers.

---

## Relationship to Semantic Versioning

| Commit Type       | Release Increment |
| ----------------- | ----------------- |
| `fix`             | PATCH             |
| `feat`            | MINOR             |
| `BREAKING CHANGE` | MAJOR             |

Print out the commit message only.
