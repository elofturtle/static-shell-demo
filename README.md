# NEON//SHELL

Static single-page demo app with a retro terminal aesthetic, CLI-style navigation, and markdown-backed project articles.

## Run

Serve the folder with a simple local HTTP server and open `index.html` in a browser.

Example:

- `python -m http.server`

Containerized local run:

- `podman build -t matrix-cli-demo .`
- `podman run --rm -p 8080:8080 matrix-cli-demo`

## Commands

- `help`
- `about`
- `projects`
- `project 1`
- `project glass vault`
- `system`
- `contact`
- `theme`
- `clear`

## Content

Project articles live in the `projects/` directory as separate markdown files and are loaded on demand by the terminal UI.

## OpenShift

OpenShift artifacts live in `openshift/`.

Current deployment direction:

- Base image: `docker.io/nginxinc/nginx-unprivileged:1.27-alpine`
- Container listens on `8080`
- `nginx.conf` is adapted for unprivileged runtime and SPA fallback
- Build strategy: OpenShift binary Docker build using `Containerfile`
- HTTPS is intentionally out of scope for now

Typical bootstrap in a fresh `oc` session:

- `oc login ...`
- `oc project <project-name>`
- `oc apply -f openshift/is.yaml`
- `oc apply -f openshift/bc.yaml`
- `oc start-build matrix-cli-demo --from-dir=. --follow`
- `oc apply -f openshift/deployment.yaml`
- `oc apply -f openshift/svc.yaml`
- `oc apply -f openshift/route.yaml`
- `oc get route`

If the build config already exists, make sure it points to `Containerfile`:

- `oc get bc matrix-cli-demo -o yaml`

## Next Session

Local handoff notes live in `SESSION_NOTES.md`. That file is gitignored on purpose so the next working session can keep operational notes without committing them.

Suggested way to bootstrap the next agent session:

1. Open this README first.
2. Open `SESSION_NOTES.md`.
3. Inspect `openshift/` and verify the manifests are still portable before applying them.
4. Run `git status` to separate committed deployment assets from local-only notes.

Agent-specific tips:

- Do not assume OpenShift can use `Containerfile` unless `BuildConfig.spec.strategy.dockerStrategy.dockerfilePath` is explicitly set.
- The app should stay on container port `8080`; external access should happen through the OpenShift Route rather than by changing the container to port `80`.
- Prefer copying only required web assets in the image build. Copying the whole repo into `/usr/share/nginx/html` pulled in `.git` and caused avoidable permission/build issues.
- Treat exported OpenShift YAML as source manifests, not raw cluster dumps. Remove `status`, generated metadata, and hardcoded namespaces when aiming for portability.
