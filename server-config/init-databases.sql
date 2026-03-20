-- Initialize product databases
-- Each product gets its own database within the shared PostgreSQL instance

CREATE DATABASE beegraded_db;
CREATE DATABASE pollenz_db;
CREATE DATABASE swarmz_db;
CREATE DATABASE fleetz_db;
CREATE DATABASE talentz_db;
CREATE DATABASE broodz_db;
CREATE DATABASE behivez_auth;

-- Create dedicated users per product (least privilege)
CREATE USER auth_user WITH PASSWORD 'change_me_auth';
CREATE USER beegraded_user WITH PASSWORD 'change_me_beegraded';
CREATE USER pollenz_user WITH PASSWORD 'change_me_pollenz';
CREATE USER swarmz_user WITH PASSWORD 'change_me_swarmz';
CREATE USER fleetz_user WITH PASSWORD 'change_me_fleetz';
CREATE USER talentz_user WITH PASSWORD 'change_me_talentz';
CREATE USER broodz_user WITH PASSWORD 'change_me_broodz';

-- Grant access
GRANT ALL PRIVILEGES ON DATABASE beegraded_db TO beegraded_user;
GRANT ALL PRIVILEGES ON DATABASE pollenz_db TO pollenz_user;
GRANT ALL PRIVILEGES ON DATABASE swarmz_db TO swarmz_user;
GRANT ALL PRIVILEGES ON DATABASE fleetz_db TO fleetz_user;
GRANT ALL PRIVILEGES ON DATABASE talentz_db TO talentz_user;
GRANT ALL PRIVILEGES ON DATABASE broodz_db TO broodz_user;
GRANT ALL PRIVILEGES ON DATABASE behivez_auth TO auth_user;
