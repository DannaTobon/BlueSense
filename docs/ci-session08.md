# CI/CD practice — Session 08

## Objective

This first phase configures and verifies the base continuous integration pipeline for the BlueSense npm monorepo. It validates the mobile and API workspaces and packages the compiled backend as a downloadable artifact. It does not deploy the API to production.

GitHub and GitHub Actions are used instead of GitLab with the professor's authorization.

## Correspondence with the class stages

The workflow follows the sequential stages from the class material:

```text
build → test → package
```

Each job uses `needs` to require the preceding job. A build failure blocks `test`, and a test or quality failure blocks `package`.

| Stage     | Purpose                                                                                    | Commands or actions                                                                                          |
| --------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `build`   | Install the locked dependencies, check both TypeScript projects, and compile the API.      | `npm ci`, `npm run typecheck`, `npm run api:typecheck`, `npm run api:build`                                  |
| `test`    | Run the existing mobile and API tests and enforce linting and formatting.                  | `npm ci`, `npm test`, `npm run lint`, `npm run api:lint`, `npm run format:check`, `npm run api:format:check` |
| `package` | Recover the API output produced by `build`, verify it, and create the deliverable archive. | `actions/download-artifact`, file checks, `tar`, `actions/upload-artifact`                                   |

All jobs run on a GitHub-hosted Linux runner. The jobs use Node.js `22.22.0`, which satisfies the API requirement of Node.js `>=22.13.0`. Every job that executes project scripts installs dependencies independently because GitHub Actions jobs do not share a working directory.

## Artifacts

The `build` job temporarily stores `apps/api/dist` as `api-dist-<commit SHA>` so the isolated `package` job can retrieve the exact compiled output. Missing build output causes the workflow to fail.

The `package` job creates `bluesense-api-<commit SHA>.tar.gz` and publishes it as the downloadable artifact `bluesense-api-<commit SHA>` for 14 days. The archive contains only the compiled API directory; it does not include `.env` files, credentials, `node_modules`, the mobile app, or the complete repository.

This stage is packaging for the academic exercise, not a production deployment.

## Finding an execution and its logs

1. Open the repository at <https://github.com/DannaTobon/BlueSense>.
2. Select the **Actions** tab.
3. Select the **CI** workflow in the left sidebar.
4. Open the run associated with branch `chore/ci-session08` or its commit.
5. Use the run graph to verify the order `Build` → `Test and quality` → `Package API artifact`.
6. Select a job and expand an individual step to inspect its command and log output.

The workflow runs on pushes to `chore/ci-session08` and `main`, and on pull requests targeting `main`. It can also be started manually with `workflow_dispatch`, but the first branch execution does not depend on a manual trigger. Concurrency cancellation avoids retaining obsolete in-progress runs for the same branch.

## Downloading the packaged API

After a successful run, open its summary and find **Artifacts**. Download `bluesense-api-<commit SHA>` and inspect the contained `.tar.gz` archive. GitHub only publishes this final artifact if all three jobs succeed.

## Controlled failure and correction

- Failed execution: <https://github.com/DannaTobon/BlueSense/actions/runs/41168246093>.
- Cause: the intentional step in `Test and quality` executed `exit 1`.
- Consequence: `Package API artifact` was skipped because it depends on the successful completion of the test job.
- Correction: the intentional failure step was removed without changing the existing tests, checks, or `needs` dependencies.
- Recovery: pending verification in GitHub Actions.

## Evidence still pending

- URL and final status of the recovery run on `chore/ci-session08`.
- Screenshot or record of the recovered three-job graph.
- Download and inspection of the packaged API artifact.

The current workflow no longer includes the intentional failure.
