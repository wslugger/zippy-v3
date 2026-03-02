---
description: Workflow for fixing a bug
---

# Bugfix Workflow

1. Replicate the bug based on the user's description. Use the browser subagent if the bug requires user interaction.

// turbo
2. Update the local repository and create a new branch specifically for this bug.
```bash
git checkout main
git pull origin main
git checkout -b fix/bug-fix-$(date +%s)
```

3. Identify the root cause of the bug by inspecting logs, tracing the network requests, and reviewing the backend files or API routes.

4. Apply the necessary code changes. Ensure the change applies narrowly to prevent side-effects on the other modules. 

5. Refresh the application locally and verify the bug has been eradicated and no regressions were introduced.

// turbo
6. Run the linter and typescript compiler to ensure there are no syntax or type errors.
```bash
npm run lint
npm run build
```

7. Ask the user if the behavior on the screen now works as expected. 

8. Stage the changes and commit them with a descriptive semantic commit message.
```bash
# Example
# git add .
# git commit -m "fix: resolve null payload issue on service creation"
```

// turbo
9. Push the fix branch to the remote repository.
```bash
git push -u origin HEAD
```

10. Confirm with the user that the branch is ready for merging.
