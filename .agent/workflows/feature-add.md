---
description: Workflow for adding a new feature
---

# Feature Add Workflow

1. Understand the user's request for the new feature and clarify any ambiguities.

// turbo
2. Update the local repository and create a new feature branch.
```bash
git checkout main
git pull origin main
git checkout -b feat/new-feature-$(date +%s)
```

3. Plan the implementation. If the feature is complex, activate Planning Mode and create an `implementation_plan.md` artifact to discuss with the user.

4. Implement the feature. Create or modify components, update the Prisma schema, routing, and backend APIs as necessary. Ensure the new UI elements follow the design system.

5. Verify the feature locally by starting the dev server or using the browser subagent.

// turbo
6. Run the linter and typescript compiler to ensure there are no syntax or type errors.
```bash
npm run lint
npm run build
```

7. Ask the user if they'd like to adjust anything about the implementation. When the user is satisfied, prepare to ship the code.

8. Stage the changes and commit them with an appropriate semantic commit message.
```bash
# Example
# git add .
# git commit -m "feat: add new widget component to the dashboard"
```

// turbo
9. Push the feature branch to the remote repository.
```bash
git push -u origin HEAD
```

10. Prompt the user to review the code or create a Pull Request on GitHub.
