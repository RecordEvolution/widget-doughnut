#!/usr/bin/env sh
# Guards for the `preversion` lifecycle hook, so they run before anything is
# bumped, committed or tagged. Every exit path here leaves the repo as it was.
set -eu

fail() {
    echo "release: $1" >&2
    exit 1
}

branch=$(git symbolic-ref --short HEAD 2>/dev/null) || fail "detached HEAD; check out main"
[ "$branch" = "main" ] || fail "on '$branch', but releases are cut from main"

git diff --quiet && git diff --cached --quiet ||
    fail "working tree is dirty; commit or stash before releasing"

git fetch --quiet origin main || fail "cannot reach origin"
git merge-base --is-ancestor origin/main HEAD ||
    fail "HEAD is behind origin/main; pull, then release"

# The generated schema types are tracked, so a stale copy would ship inside the
# tag. Regenerating has to be a no-op: a diff means definition-schema.json was
# edited without running `npm run types`.
if [ "$(node -p "require('./package.json').scripts.types ? 'yes' : 'no'")" = yes ]; then
    npm run --silent types
    git diff --quiet -- src/definition-schema.d.ts ||
        fail "src/definition-schema.d.ts is stale; commit the regenerated file, then release"
fi

# Build gate. CI builds again from the tag, but failing here costs no version.
npm run build
