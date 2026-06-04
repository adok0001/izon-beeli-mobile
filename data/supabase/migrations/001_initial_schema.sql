create extension if not exists "uuid-ossp";

create table orgs (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  tier text not null default 'community' check (tier in ('community', 'professional', 'organization')),
  owner_id text not null,
  stripe_customer_id text,
  created_at timestamptz not null default now()
);

create table org_members (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references orgs(id) on delete cascade,
  user_id text not null,
  role text not null default 'contributor' check (role in ('org_admin', 'project_manager', 'reviewer', 'contributor')),
  created_at timestamptz not null default now(),
  unique(org_id, user_id)
);

create table projects (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references orgs(id) on delete cascade,
  name text not null,
  description text,
  language_name text not null,
  language_code text not null,
  task_type text not null default 'translation' check (task_type in ('translation', 'sentence_collection')),
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

create table project_members (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id text not null,
  role text not null default 'contributor' check (role in ('project_manager', 'reviewer', 'contributor')),
  created_at timestamptz not null default now(),
  unique(project_id, user_id)
);

create table tasks (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  source_text text not null,
  source_language text not null,
  created_at timestamptz not null default now()
);

create table submissions (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid not null references tasks(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  contributor_id text not null,
  text text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'flagged')),
  reviewer_note text,
  reviewer_id text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index on org_members(user_id);
create index on project_members(user_id);
create index on project_members(project_id);
create index on tasks(project_id);
create index on submissions(project_id);
create index on submissions(status);

alter table orgs enable row level security;
alter table org_members enable row level security;
alter table projects enable row level security;
alter table project_members enable row level security;
alter table tasks enable row level security;
alter table submissions enable row level security;

create policy "org members view orgs" on orgs for select
  using (id in (select org_id from org_members where user_id = auth.uid()::text) or owner_id = auth.uid()::text);

create policy "public projects visible" on projects for select using (is_public = true);
create policy "private projects to members" on projects for select
  using (not is_public and org_id in (select org_id from org_members where user_id = auth.uid()::text));

create policy "tasks visible to org members" on tasks for select
  using (project_id in (select p.id from projects p join org_members om on om.org_id = p.org_id where om.user_id = auth.uid()::text));

create policy "contributors see own submissions" on submissions for select using (contributor_id = auth.uid()::text);
create policy "reviewers see project submissions" on submissions for select
  using (project_id in (select project_id from project_members where user_id = auth.uid()::text and role in ('reviewer', 'project_manager')));
create policy "contributors insert submissions" on submissions for insert with check (contributor_id = auth.uid()::text);
create policy "reviewers update submissions" on submissions for update
  using (project_id in (select project_id from project_members where user_id = auth.uid()::text and role in ('reviewer', 'project_manager')));
