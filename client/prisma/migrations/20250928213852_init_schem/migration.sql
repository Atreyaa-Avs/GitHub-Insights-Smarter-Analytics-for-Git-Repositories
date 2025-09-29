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
CREATE TABLE "public"."GhUser" (
    "id" BIGSERIAL NOT NULL,
    "login" TEXT NOT NULL,
    "avatar_url" TEXT,
    "type" TEXT,

    CONSTRAINT "GhUser_pkey" PRIMARY KEY ("id")
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

    CONSTRAINT "Commit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Issue" (
    "id" BIGSERIAL NOT NULL,
    "issue_number" INTEGER NOT NULL,
    "title" TEXT,
    "state" TEXT,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "repo_id" BIGINT NOT NULL,
    "author_login" TEXT,

    CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Pull" (
    "id" BIGSERIAL NOT NULL,
    "pr_number" INTEGER NOT NULL,
    "title" TEXT,
    "state" TEXT,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "merged_at" TIMESTAMP(3),
    "repo_id" BIGINT NOT NULL,
    "author_login" TEXT,

    CONSTRAINT "Pull_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Release" (
    "id" BIGSERIAL NOT NULL,
    "release_id" BIGINT NOT NULL,
    "tag_name" TEXT,
    "name" TEXT,
    "created_at" TIMESTAMP(3),
    "published_at" TIMESTAMP(3),
    "repo_id" BIGINT NOT NULL,

    CONSTRAINT "Release_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RepoLanguage" (
    "id" BIGSERIAL NOT NULL,
    "language" TEXT NOT NULL,
    "bytes_of_code" BIGINT NOT NULL,
    "repo_id" BIGINT NOT NULL,

    CONSTRAINT "RepoLanguage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ParticipationStats" (
    "id" BIGSERIAL NOT NULL,
    "week_start" TIMESTAMP(3) NOT NULL,
    "all_commits" INTEGER NOT NULL,
    "owner_commits" INTEGER NOT NULL,
    "repo_id" BIGINT NOT NULL,

    CONSTRAINT "ParticipationStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WeeklyCommit" (
    "id" BIGSERIAL NOT NULL,
    "repo_id" BIGINT NOT NULL,
    "week" TIMESTAMP(3) NOT NULL,
    "total" INTEGER NOT NULL,

    CONSTRAINT "WeeklyCommit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ContributorRank" (
    "id" BIGSERIAL NOT NULL,
    "repo_id" BIGINT NOT NULL,
    "user_login" TEXT NOT NULL,
    "contributions" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ContributorRank_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Repo_updated_at_idx" ON "public"."Repo"("updated_at");

-- CreateIndex
CREATE INDEX "Repo_pushed_at_idx" ON "public"."Repo"("pushed_at");

-- CreateIndex
CREATE UNIQUE INDEX "owner_name" ON "public"."Repo"("owner", "name");

-- CreateIndex
CREATE UNIQUE INDEX "GhUser_login_key" ON "public"."GhUser"("login");

-- CreateIndex
CREATE UNIQUE INDEX "Commit_sha_key" ON "public"."Commit"("sha");

-- CreateIndex
CREATE INDEX "Commit_repo_id_committed_at_idx" ON "public"."Commit"("repo_id", "committed_at");

-- CreateIndex
CREATE INDEX "Issue_repo_id_state_created_at_idx" ON "public"."Issue"("repo_id", "state", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "Issue_repo_id_issue_number_key" ON "public"."Issue"("repo_id", "issue_number");

-- CreateIndex
CREATE INDEX "Pull_repo_id_state_created_at_idx" ON "public"."Pull"("repo_id", "state", "created_at");

-- CreateIndex
CREATE INDEX "Pull_repo_id_merged_at_idx" ON "public"."Pull"("repo_id", "merged_at");

-- CreateIndex
CREATE UNIQUE INDEX "Pull_repo_id_pr_number_key" ON "public"."Pull"("repo_id", "pr_number");

-- CreateIndex
CREATE UNIQUE INDEX "Release_release_id_key" ON "public"."Release"("release_id");

-- CreateIndex
CREATE INDEX "Release_repo_id_published_at_idx" ON "public"."Release"("repo_id", "published_at");

-- CreateIndex
CREATE INDEX "RepoLanguage_repo_id_idx" ON "public"."RepoLanguage"("repo_id");

-- CreateIndex
CREATE UNIQUE INDEX "RepoLanguage_repo_id_language_key" ON "public"."RepoLanguage"("repo_id", "language");

-- CreateIndex
CREATE INDEX "ParticipationStats_repo_id_week_start_idx" ON "public"."ParticipationStats"("repo_id", "week_start");

-- CreateIndex
CREATE UNIQUE INDEX "ParticipationStats_repo_id_week_start_key" ON "public"."ParticipationStats"("repo_id", "week_start");

-- CreateIndex
CREATE INDEX "WeeklyCommit_repo_id_week_idx" ON "public"."WeeklyCommit"("repo_id", "week");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyCommit_repo_id_week_key" ON "public"."WeeklyCommit"("repo_id", "week");

-- CreateIndex
CREATE INDEX "ContributorRank_repo_id_contributions_idx" ON "public"."ContributorRank"("repo_id", "contributions");

-- CreateIndex
CREATE UNIQUE INDEX "ContributorRank_repo_id_user_login_key" ON "public"."ContributorRank"("repo_id", "user_login");

-- AddForeignKey
ALTER TABLE "public"."Commit" ADD CONSTRAINT "Commit_repo_id_fkey" FOREIGN KEY ("repo_id") REFERENCES "public"."Repo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Commit" ADD CONSTRAINT "Commit_author_login_fkey" FOREIGN KEY ("author_login") REFERENCES "public"."GhUser"("login") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Commit" ADD CONSTRAINT "Commit_committer_login_fkey" FOREIGN KEY ("committer_login") REFERENCES "public"."GhUser"("login") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Issue" ADD CONSTRAINT "Issue_repo_id_fkey" FOREIGN KEY ("repo_id") REFERENCES "public"."Repo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Issue" ADD CONSTRAINT "Issue_author_login_fkey" FOREIGN KEY ("author_login") REFERENCES "public"."GhUser"("login") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Pull" ADD CONSTRAINT "Pull_repo_id_fkey" FOREIGN KEY ("repo_id") REFERENCES "public"."Repo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Pull" ADD CONSTRAINT "Pull_author_login_fkey" FOREIGN KEY ("author_login") REFERENCES "public"."GhUser"("login") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Release" ADD CONSTRAINT "Release_repo_id_fkey" FOREIGN KEY ("repo_id") REFERENCES "public"."Repo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RepoLanguage" ADD CONSTRAINT "RepoLanguage_repo_id_fkey" FOREIGN KEY ("repo_id") REFERENCES "public"."Repo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ParticipationStats" ADD CONSTRAINT "ParticipationStats_repo_id_fkey" FOREIGN KEY ("repo_id") REFERENCES "public"."Repo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WeeklyCommit" ADD CONSTRAINT "WeeklyCommit_repo_id_fkey" FOREIGN KEY ("repo_id") REFERENCES "public"."Repo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContributorRank" ADD CONSTRAINT "ContributorRank_repo_id_fkey" FOREIGN KEY ("repo_id") REFERENCES "public"."Repo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContributorRank" ADD CONSTRAINT "ContributorRank_user_login_fkey" FOREIGN KEY ("user_login") REFERENCES "public"."GhUser"("login") ON DELETE RESTRICT ON UPDATE CASCADE;
