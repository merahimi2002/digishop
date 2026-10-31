-- Development-only roles; never use these fixture passwords outside loopback development.
CREATE ROLE digishop_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD 'local-only-app';
CREATE DATABASE digishop_test OWNER digishop_owner;
ALTER DATABASE digishop SET timezone TO 'UTC';
ALTER DATABASE digishop_test SET timezone TO 'UTC';
