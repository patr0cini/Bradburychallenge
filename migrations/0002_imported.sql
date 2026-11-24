-- Dias importados ao entrar (sequência que o leitor já tinha antes da leaderboard). Executar uma vez.
ALTER TABLE readers ADD COLUMN imported INTEGER NOT NULL DEFAULT 0;
