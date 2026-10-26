CREATE TABLE project (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title varchar(200) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE card (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  project_id integer NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  title varchar(200) NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  priority smallint NOT NULL DEFAULT 2 CHECK (priority BETWEEN 1 AND 3),
  due_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON card (project_id);
