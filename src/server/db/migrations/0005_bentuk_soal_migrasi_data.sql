-- Migrasi data: tipe soal lama `single_choice` = PG sederhana di kerangka TKA.
UPDATE `questions` SET `type` = 'pg' WHERE `type` = 'single_choice';
