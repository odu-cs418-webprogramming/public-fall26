---
name: small-feature
description: Plans and implements small features in an existing React, Node, Express, and MySQL application. Use when adding a UI control or changing existing feature behavior.
---

# Small feature development

## Understand the project

Read the relevant component, route, and existing helpers. Trace the data involved in the requested behavior. Identify whether the change belongs in React, Express, or the database.

Ask about a missing requirement when different answers would change the implementation. Use the actual file paths, state names, response fields, and package versions found in the project.

## Propose a plan

Explain which files need to change and why. Describe the smallest working version and give an ordinary input and an edge case with their expected results.

For a planning request, present the plan and wait for the user to request implementation. When the user has already authorized implementation, carry out the agreed scope.

## Implement the change

Follow the project's existing patterns and dependencies. Reuse existing state and helpers where they fit. Preserve the behavior existing callers rely on. Keep each edit connected to the requested feature.

## Check the result

Inspect the available project scripts before choosing commands. Run relevant checks when tools and project setup allow. Check the ordinary and edge cases against the intended behavior.

Report the commands and results actually observed. Identify browser interactions or other checks the user still needs to perform.

## Explain the work

Show the diff, summarize the behavior that changed, and explain the decisions the user needs to review. Make it clear which checks passed and which remain open.
