-- CreateTable
CREATE TABLE "public"."Repo" (
    "id" BIGSERIAL NOT NULL,
    "owner" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "visibility" TEXT,
    "default_branch" TEXT,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),
    "pushed_at" TIMESTAMP(3),
    "avatar_url" TEXT,
    "html_url" TEXT,
    "stargazers_count" INTEGER NOT NULL DEFAULT 0,
    "watchers_count" INTEGER NOT NULL DEFAULT 0,
    "subscribers_count" INTEGER NOT NULL DEFAULT 0,
    "forks_count" INTEGER NOT NULL DEFAULT 0,
    "branch_count" INTEGER NOT NULL DEFAULT 0,
    "tag_count" INTEGER NOT NULL DEFAULT 0,
    "open_prs_count" INTEGER NOT NULL DEFAULT 0,
    "open_issues_count" INTEGER NOT NULL DEFAULT 0,
    "size_kb" INTEGER NOT NULL DEFAULT 0,
    "language" TEXT,
    "license_name" TEXT,
    "homepage" TEXT,
    "topics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "last_commit" TIMESTAMP(3),

    CONSTRAINT "Repo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Commit" (
    "id" BIGSERIAL NOT NULL,
    "sha" TEXT NOT NULL,
    "message" TEXT,
    "committed_at" TIMESTAMP(3),
    "repo_id" BIGINT NOT NULL,
    "author_login" TEXT,
    "committer_login" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Commit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Repo_updated_at_idx" ON "public"."Repo"("updated_at");

-- CreateIndex
CREATE INDEX "Repo_pushed_at_idx" ON "public"."Repo"("pushed_at");

-- CreateIndex
CREATE UNIQUE INDEX "owner_name" ON "public"."Repo"("owner", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Commit_sha_key" ON "public"."Commit"("sha");

-- CreateIndex
CREATE INDEX "Commit_repo_id_committed_at_idx" ON "public"."Commit"("repo_id", "committed_at");

-- AddForeignKey
ALTER TABLE "public"."Commit" ADD CONSTRAINT "Commit_repo_id_fkey" FOREIGN KEY ("repo_id") REFERENCES "public"."Repo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
