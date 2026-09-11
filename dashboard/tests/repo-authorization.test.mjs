import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { beforeEach, afterEach, test, mock } from "node:test";

const require = createRequire(import.meta.url);
let state;

// Replace only infrastructure boundaries. Requests execute the real route,
// GitHub authorization helper, validation schema, and API-key implementation.
function stubModule(id, exports) {
  const filename = require.resolve(id);
  require.cache[filename] = { id: filename, filename, loaded: true, exports };
}

stubModule("@/auth", { auth: async () => state.session });
stubModule("@/lib/prisma", {
  prisma: {
    account: { findFirst: async () => state.token ? { access_token: state.token } : null },
    repo: {
      findUnique: async () => state.existing,
      findFirst: async () => state.existing,
      create: async (args) => {
        state.creates.push(args);
        return { id: "connected-repo" };
      },
    },
    apiKey: { upsert: async (args) => { state.rotations.push(args); } },
  },
});

const { POST: connectRepo } = require("@/app/api/repos/route");
const { POST: rotateKey } = require("@/app/api/repos/[id]/rotate-key/route");
const { userCanAccessRepo, listAccessibleRepos } = require("@/lib/github");

const githubRepo = (permissions = { pull: true, push: true, admin: false }) => ({
  id: 123,
  name: "scanner",
  owner: { login: "Owner" },
  private: false,
  permissions,
});

beforeEach(() => {
  state = {
    session: { user: { id: "test-user" } },
    token: "test-token",
    githubBody: githubRepo(),
    githubStatus: 200,
    existing: null,
    creates: [],
    rotations: [],
    requests: [],
  };
  mock.method(globalThis, "fetch", async (url, options) => {
    state.requests.push({ url, options });
    return Response.json(state.githubBody, { status: state.githubStatus });
  });
});

afterEach(() => mock.restoreAll());

function connectRequest(body = {}) {
  return new Request("http://localhost/api/repos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ githubRepoId: 123, owner: "owner", name: "scanner", ...body }),
  });
}

function rotateRequest() {
  state.existing = { id: "connected-repo", githubRepoId: "123", owner: "Owner", name: "scanner" };
  return rotateKey(new Request("http://localhost/api/repos/connected-repo/rotate-key", { method: "POST" }), {
    params: Promise.resolve({ id: "connected-repo" }),
  });
}

test("an unsigned user cannot connect or rotate a key", async () => {
  state.session = null;
  assert.equal((await connectRepo(connectRequest())).status, 401);
  assert.equal((await rotateRequest()).status, 401);
  assert.equal(state.requests.length, 0);
});

test("public-repository read access cannot create an upload key", async () => {
  state.githubBody = githubRepo({ pull: true, push: false, admin: false });
  assert.equal((await connectRepo(connectRequest())).status, 403);
  assert.equal(state.creates.length, 0);
});

test("public-repository read access cannot invalidate an existing upload key", async () => {
  state.githubBody = githubRepo({ pull: true, push: false, admin: false });
  assert.equal((await rotateRequest()).status, 403);
  assert.equal(state.rotations.length, 0);
});

test("missing permission data fails closed for key management", async () => {
  delete state.githubBody.permissions;
  assert.equal((await rotateRequest()).status, 403);
  assert.equal(state.rotations.length, 0);
});

test("a client cannot bind a key to an unrelated GitHub repository ID", async () => {
  assert.equal((await connectRepo(connectRequest({ githubRepoId: 999 }))).status, 400);
  assert.equal(state.creates.length, 0);
});

test("connecting uses the canonical identity returned by GitHub", async () => {
  const response = await connectRepo(connectRequest());
  assert.equal(response.status, 201);
  assert.equal(state.creates.length, 1);
  assert.equal(state.creates[0].data.githubRepoId, "123");
  assert.equal(state.creates[0].data.owner, "Owner");
  assert.equal(state.creates[0].data.name, "scanner");
  assert.match((await response.json()).rawKey, /^dpdp_[0-9a-f]{64}$/);
});

test("write access to the stored repository allows rotation", async () => {
  const response = await rotateRequest();
  assert.equal(response.status, 200);
  assert.equal(state.rotations.length, 1);
  assert.equal(state.rotations[0].where.repoId, "connected-repo");
  assert.match((await response.json()).rawKey, /^dpdp_[0-9a-f]{64}$/);
});

test("reusing an old repository name cannot authorize rotation for its previous ID", async () => {
  state.githubBody.id = 999;
  assert.equal((await rotateRequest()).status, 403);
  assert.equal(state.rotations.length, 0);
});

test("scan read access is bound to the stored GitHub ID", async () => {
  state.githubBody = githubRepo({ pull: true, push: false, admin: false });
  assert.equal(await userCanAccessRepo("test-user", "Owner", "scanner", "123"), true);
  assert.equal(await userCanAccessRepo("test-user", "Owner", "scanner", "999"), false);
});

test("GitHub refusal and missing tokens cannot authorize rotation", async () => {
  state.githubStatus = 403;
  assert.equal((await rotateRequest()).status, 403);
  state.token = null;
  assert.equal((await rotateRequest()).status, 403);
  assert.equal(state.rotations.length, 0);
  assert.equal(state.requests.length, 1);
});

test("the repo picker marks read-only repositories as unavailable for key management", async () => {
  state.githubBody = [githubRepo({ pull: true, push: false, admin: false })];
  const repos = await listAccessibleRepos("test-user");
  assert.equal(repos[0].canManage, false);
});
