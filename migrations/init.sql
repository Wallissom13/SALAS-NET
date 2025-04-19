-- Inicialização das tabelas do banco de dados

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE
);

-- Tabela de turmas
CREATE TABLE IF NOT EXISTS classes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- Tabela de alunos
CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  class_id INTEGER NOT NULL
);

-- Tabela de relatórios
CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  description TEXT NOT NULL,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  student_id INTEGER NOT NULL,
  reporter_name TEXT NOT NULL,
  reporter_type TEXT NOT NULL
);

-- Inserir usuário administrador padrão se não existir
INSERT INTO users (username, password, is_admin)
VALUES ('Wallisson10', 'CEPI10', TRUE)
ON CONFLICT (username) DO NOTHING;

-- Inserir turmas padrão se não existirem
INSERT INTO classes (name) VALUES ('6A') ON CONFLICT (name) DO NOTHING;
INSERT INTO classes (name) VALUES ('6B') ON CONFLICT (name) DO NOTHING;
INSERT INTO classes (name) VALUES ('6C') ON CONFLICT (name) DO NOTHING;
INSERT INTO classes (name) VALUES ('7A') ON CONFLICT (name) DO NOTHING;
INSERT INTO classes (name) VALUES ('7B') ON CONFLICT (name) DO NOTHING;
INSERT INTO classes (name) VALUES ('7C') ON CONFLICT (name) DO NOTHING;
INSERT INTO classes (name) VALUES ('8A') ON CONFLICT (name) DO NOTHING;
INSERT INTO classes (name) VALUES ('8B') ON CONFLICT (name) DO NOTHING;
INSERT INTO classes (name) VALUES ('9B') ON CONFLICT (name) DO NOTHING;