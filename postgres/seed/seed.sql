BEGIN TRANSACTION;

INSERT into users(name, email, entries, joined) values ('Jessie', 'jessie@gmail.com', 5, '2018-01-01');
INSERT into login(hash, email) values ('$2a$04$8y3VZnwGhWrEkja4WB0.5uQRhYf.vh8qoRm3VEOCdZMkEWEsAYwxW', 'jessie@gmail.com');

COMMIT;