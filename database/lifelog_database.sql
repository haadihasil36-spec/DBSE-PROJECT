-- ============================================================
-- LifeLog — Personal Activity Intelligence Database
-- Complete MySQL 8+ setup
-- Run this ONE file in MySQL Workbench / MySQL client.
-- ============================================================

CREATE DATABASE lifelog_db;
USE lifelog_db;

-- -------------------------
-- 1. USERS
-- -------------------------
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------
-- 2. ACTIVITY CATEGORIES
-- -------------------------
CREATE TABLE activity_categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
);

-- -------------------------
-- 3. DAILY LOGS
-- -------------------------
CREATE TABLE daily_logs (
    day_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    log_date DATE NOT NULL,
    notes TEXT,
    UNIQUE(user_id, log_date),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- -------------------------
-- 4. LOCATIONS
-- -------------------------
CREATE TABLE locations (
    location_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    location_name VARCHAR(100) NOT NULL,
    location_type VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- -------------------------
-- 5. ACTIVITIES
-- -------------------------
CREATE TABLE activities (
    activity_id INT AUTO_INCREMENT PRIMARY KEY,
    day_id INT NOT NULL,
    category_id INT NOT NULL,
    location_id INT,
    activity_name VARCHAR(150) NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    description TEXT,
    CHECK (end_time > start_time),
    FOREIGN KEY (day_id) REFERENCES daily_logs(day_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES activity_categories(category_id),
    FOREIGN KEY (location_id) REFERENCES locations(location_id)
);

-- -------------------------
-- 6. EXPENSES
-- -------------------------
CREATE TABLE expenses (
    expense_id INT AUTO_INCREMENT PRIMARY KEY,
    day_id INT NOT NULL,
    category VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(30),
    description VARCHAR(255),
    CHECK (amount >= 0),
    FOREIGN KEY (day_id) REFERENCES daily_logs(day_id) ON DELETE CASCADE
);

-- -------------------------
-- 7. FOOD LOGS
-- -------------------------
CREATE TABLE food_logs (
    food_id INT AUTO_INCREMENT PRIMARY KEY,
    day_id INT NOT NULL,
    meal_type ENUM('Breakfast','Lunch','Dinner','Snack') NOT NULL,
    food_name VARCHAR(150) NOT NULL,
    quantity VARCHAR(50),
    calories INT,
    cost DECIMAL(10,2),
    FOREIGN KEY (day_id) REFERENCES daily_logs(day_id) ON DELETE CASCADE
);

-- -------------------------
-- 8. STUDY SESSIONS
-- -------------------------
CREATE TABLE study_sessions (
    study_id INT AUTO_INCREMENT PRIMARY KEY,
    day_id INT NOT NULL,
    subject VARCHAR(100) NOT NULL,
    topic VARCHAR(150),
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    productivity_rating INT,
    CHECK (end_time > start_time),
    CHECK (productivity_rating BETWEEN 1 AND 5),
    FOREIGN KEY (day_id) REFERENCES daily_logs(day_id) ON DELETE CASCADE
);

-- -------------------------
-- 9. TRANSPORT LOGS
-- -------------------------
CREATE TABLE transport_logs (
    transport_id INT AUTO_INCREMENT PRIMARY KEY,
    day_id INT NOT NULL,
    mode VARCHAR(50) NOT NULL,
    source_location VARCHAR(100),
    destination_location VARCHAR(100),
    distance_km DECIMAL(8,2),
    duration_minutes INT,
    cost DECIMAL(10,2),
    FOREIGN KEY (day_id) REFERENCES daily_logs(day_id) ON DELETE CASCADE
);

-- -------------------------
-- 10. SCREEN TIME
-- -------------------------
CREATE TABLE screen_time_logs (
    screen_id INT AUTO_INCREMENT PRIMARY KEY,
    day_id INT NOT NULL,
    application_name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    duration_minutes INT NOT NULL,
    CHECK (duration_minutes >= 0),
    FOREIGN KEY (day_id) REFERENCES daily_logs(day_id) ON DELETE CASCADE
);

-- -------------------------
-- 11. MOOD
-- -------------------------
CREATE TABLE mood_logs (
    mood_id INT AUTO_INCREMENT PRIMARY KEY,
    day_id INT NOT NULL,
    mood VARCHAR(50) NOT NULL,
    mood_score INT NOT NULL,
    reason VARCHAR(255),
    CHECK (mood_score BETWEEN 1 AND 10),
    FOREIGN KEY (day_id) REFERENCES daily_logs(day_id) ON DELETE CASCADE
);

-- -------------------------
-- 12. SLEEP
-- -------------------------
CREATE TABLE sleep_logs (
    sleep_id INT AUTO_INCREMENT PRIMARY KEY,
    day_id INT NOT NULL,
    sleep_start DATETIME NOT NULL,
    sleep_end DATETIME NOT NULL,
    quality_score INT,
    CHECK (sleep_end > sleep_start),
    CHECK (quality_score BETWEEN 1 AND 5),
    FOREIGN KEY (day_id) REFERENCES daily_logs(day_id) ON DELETE CASCADE
);

-- -------------------------
-- 13. GOALS
-- -------------------------
CREATE TABLE goals (
    goal_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    goal_name VARCHAR(150) NOT NULL,
    goal_type VARCHAR(50),
    target_value DECIMAL(10,2),
    unit VARCHAR(30),
    start_date DATE,
    end_date DATE,
    status ENUM('Active','Completed','Failed') DEFAULT 'Active',
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- -------------------------
-- 14. GOAL PROGRESS
-- -------------------------
CREATE TABLE goal_progress (
    progress_id INT AUTO_INCREMENT PRIMARY KEY,
    goal_id INT NOT NULL,
    progress_date DATE NOT NULL,
    actual_value DECIMAL(10,2) NOT NULL,
    UNIQUE(goal_id, progress_date),
    FOREIGN KEY (goal_id) REFERENCES goals(goal_id) ON DELETE CASCADE
);

-- ============================================================
-- SAMPLE DATA
-- ============================================================

INSERT INTO users (full_name, email, password_hash, date_of_birth) VALUES
('Rahul Sharma', 'rahul@lifelog.com', 'demo_hash_rahul', '2004-05-12'),
('Ananya Rao', 'ananya@lifelog.com', 'demo_hash_ananya', '2004-09-18'),
('Arjun Kumar', 'arjun@lifelog.com', 'demo_hash_arjun', '2003-12-02');

INSERT INTO activity_categories (category_name, description) VALUES
('Study', 'Academic learning and study sessions'),
('Work', 'Work, projects and professional tasks'),
('Exercise', 'Gym, cardio and physical activity'),
('Entertainment', 'Movies, games and leisure'),
('Travel', 'Travel and commuting'),
('Social', 'Friends, family and social activities'),
('Personal', 'Personal routines and errands'),
('Sleep', 'Sleeping and rest');

INSERT INTO daily_logs (user_id, log_date, notes) VALUES
(1,'2026-09-01','Started the week with DBSE preparation.'),
(1,'2026-09-02','College and SQL practice day.'),
(1,'2026-09-03','Gym and database project work.'),
(1,'2026-09-04','SQL revision and evening meetup.'),
(1,'2026-09-05','Long study session and cardio.'),
(1,'2026-09-06','Movie and lighter study day.'),
(1,'2026-09-07','Strong study day focused on normalization.'),
(2,'2026-09-05','Library study session.'),
(2,'2026-09-06','College classes and revision.'),
(2,'2026-09-07','Study and personal activities.'),
(3,'2026-09-05','Office and gym.'),
(3,'2026-09-06','Work project day.'),
(3,'2026-09-07','Exercise and personal errands.');

INSERT INTO locations (user_id, location_name, location_type) VALUES
(1,'Home','Residence'),
(1,'College','Education'),
(1,'Library','Education'),
(1,'Gym','Fitness'),
(1,'Canteen','Food'),
(1,'Cafe','Social'),
(1,'Bus Stop','Transport'),
(2,'Home','Residence'),
(2,'College','Education'),
(2,'Library','Education'),
(3,'Home','Residence'),
(3,'Office','Work'),
(3,'Gym','Fitness');

INSERT INTO activities
(day_id, category_id, location_id, activity_name, start_time, end_time, description)
VALUES
(1,5,7,'Travel to College','2026-09-01 08:00:00','2026-09-01 08:35:00','Morning bus commute'),
(1,1,2,'DBMS Study','2026-09-01 09:00:00','2026-09-01 11:00:00','Database fundamentals'),
(1,3,4,'Gym Workout','2026-09-01 17:00:00','2026-09-01 17:50:00','Strength workout'),
(2,1,3,'SQL Practice','2026-09-02 18:00:00','2026-09-02 19:30:00','SQL joins and aggregation'),
(2,6,6,'Meet Friends','2026-09-02 20:00:00','2026-09-02 22:00:00','Evening meetup'),
(3,1,3,'Database Project','2026-09-03 16:00:00','2026-09-03 18:00:00','LifeLog database work'),
(3,3,4,'Cardio','2026-09-03 18:30:00','2026-09-03 19:20:00','Cardio workout'),
(4,6,6,'Friends Meetup','2026-09-04 19:30:00','2026-09-04 21:30:00','Cafe meetup'),
(4,1,3,'DBSE Preparation','2026-09-04 16:00:00','2026-09-04 17:20:00','DBSE exam preparation'),
(5,1,3,'SQL Revision','2026-09-05 09:00:00','2026-09-05 11:00:00','SQL revision'),
(5,3,4,'Gym Workout','2026-09-05 17:00:00','2026-09-05 18:00:00','Workout'),
(6,4,1,'Movie','2026-09-06 20:00:00','2026-09-06 22:00:00','Movie night'),
(7,1,3,'DBSE Preparation','2026-09-07 09:00:00','2026-09-07 11:00:00','Normalization and transactions'),
(7,1,3,'SQL Practice','2026-09-07 18:00:00','2026-09-07 19:30:00','Advanced SQL'),
(8,1,10,'Library Study','2026-09-05 10:00:00','2026-09-05 12:30:00','Ananya study session'),
(9,1,9,'College Classes','2026-09-06 09:00:00','2026-09-06 12:00:00','College classes'),
(10,1,10,'Revision','2026-09-07 17:00:00','2026-09-07 19:00:00','Revision'),
(11,2,12,'Office Work','2026-09-05 09:00:00','2026-09-05 17:00:00','Office work'),
(11,3,13,'Gym Workout','2026-09-05 18:00:00','2026-09-05 19:00:00','Workout'),
(12,2,12,'Project Work','2026-09-06 09:00:00','2026-09-06 16:00:00','Work project'),
(13,3,13,'Gym Workout','2026-09-07 18:00:00','2026-09-07 19:00:00','Workout');

INSERT INTO expenses (day_id, category, amount, payment_method, description) VALUES
(1,'Food',180,'UPI','Lunch'),
(1,'Travel',80,'UPI','Bus fare'),
(2,'Food',150,'UPI','Lunch'),
(2,'Travel',70,'Cash','Auto'),
(2,'Education',250,'UPI','Study notes'),
(3,'Food',220,'UPI','Dinner'),
(3,'Travel',90,'UPI','Bus fare'),
(4,'Food',180,'UPI','Dinner'),
(4,'Entertainment',420,'Card','Movie'),
(5,'Food',240,'UPI','Lunch'),
(5,'Travel',80,'UPI','Bus fare'),
(6,'Food',160,'UPI','Dinner'),
(6,'Entertainment',300,'Card','Movie'),
(7,'Food',320,'UPI','Dinner'),
(7,'Travel',80,'UPI','Bus pass'),
(7,'Education',250,'Cash','DBSE notes');

INSERT INTO food_logs
(day_id, meal_type, food_name, quantity, calories, cost) VALUES
(1,'Breakfast','Idli','3 pieces',280,60),
(1,'Lunch','Chicken Rice','1 plate',620,180),
(2,'Breakfast','Dosa','2 pieces',320,70),
(2,'Lunch','Veg Thali','1 plate',580,150),
(3,'Breakfast','Upma','1 bowl',300,70),
(3,'Dinner','Biryani','1 plate',720,220),
(4,'Breakfast','Poha','1 bowl',280,60),
(4,'Dinner','Pizza','2 slices',520,180),
(5,'Breakfast','Eggs and Toast','1 serving',430,120),
(5,'Lunch','Rice and Dal','1 plate',560,160),
(6,'Breakfast','Sandwich','1 serving',360,120),
(6,'Dinner','Fried Rice','1 plate',600,160),
(7,'Breakfast','Idli','3 pieces',280,60),
(7,'Lunch','Chicken Rice','1 plate',620,180),
(7,'Snack','Tea','1 cup',90,30);

INSERT INTO study_sessions
(day_id, subject, topic, start_time, end_time, productivity_rating) VALUES
(1,'DBMS','ER Model','2026-09-01 09:00:00','2026-09-01 11:00:00',4),
(2,'DBSE','SQL Joins','2026-09-02 18:00:00','2026-09-02 19:30:00',4),
(3,'DBSE','Database Design','2026-09-03 16:00:00','2026-09-03 18:00:00',5),
(4,'DBSE','SQL Queries','2026-09-04 16:00:00','2026-09-04 17:20:00',5),
(5,'Java','Collections','2026-09-05 09:00:00','2026-09-05 09:45:00',4),
(5,'DBSE','Normalization','2026-09-05 10:00:00','2026-09-05 11:15:00',5),
(6,'DBMS','Transactions','2026-09-06 17:00:00','2026-09-06 18:00:00',4),
(7,'DBSE','Normalization','2026-09-07 09:00:00','2026-09-07 11:00:00',5),
(7,'DBSE','SQL Queries','2026-09-07 18:00:00','2026-09-07 19:30:00',5),
(8,'DBMS','Indexing','2026-09-05 10:00:00','2026-09-05 12:30:00',4),
(9,'DBSE','Transactions','2026-09-06 09:00:00','2026-09-06 12:00:00',4),
(10,'DBSE','Revision','2026-09-07 17:00:00','2026-09-07 19:00:00',5);

INSERT INTO transport_logs
(day_id, mode, source_location, destination_location, distance_km, duration_minutes, cost) VALUES
(1,'Bus','Home','College',8.5,35,40),
(1,'Bus','College','Home',8.5,40,40),
(2,'Auto','Home','College',7.8,30,70),
(3,'Bus','Home','College',8.5,38,45),
(4,'Bus','Home','College',8.5,35,40),
(5,'Bus','Home','College',8.5,35,40),
(6,'Metro','Home','City Center',11.0,42,60),
(7,'Bus','Home','College',8.5,35,40),
(7,'Bus','College','Home',8.5,40,40);

INSERT INTO screen_time_logs
(day_id, application_name, category, duration_minutes) VALUES
(1,'YouTube','Entertainment',68),
(1,'WhatsApp','Social',45),
(1,'Chrome','Productivity',42),
(2,'YouTube','Entertainment',74),
(2,'WhatsApp','Social',52),
(2,'Instagram','Social',38),
(3,'VS Code','Productivity',65),
(3,'Chrome','Productivity',46),
(3,'YouTube','Entertainment',35),
(4,'WhatsApp','Social',52),
(4,'Instagram','Social',38),
(4,'Chrome','Productivity',46),
(5,'VS Code','Productivity',31),
(5,'YouTube','Entertainment',60),
(6,'Netflix','Entertainment',85),
(6,'WhatsApp','Social',40),
(7,'YouTube','Entertainment',74),
(7,'WhatsApp','Social',52),
(7,'Chrome','Productivity',46),
(7,'Instagram','Social',38),
(7,'VS Code','Productivity',31),
(7,'Netflix','Entertainment',21);

INSERT INTO mood_logs (day_id, mood, mood_score, reason) VALUES
(1,'Happy',8,'Good start to the week'),
(2,'Focused',8,'Productive SQL practice'),
(3,'Motivated',9,'Database project progress'),
(4,'Calm',8,'Balanced study and social time'),
(5,'Energized',9,'Good workout and study'),
(6,'Relaxed',7,'Movie and lighter workload'),
(7,'Excellent',10,'Strong study performance');

INSERT INTO sleep_logs
(day_id, sleep_start, sleep_end, quality_score) VALUES
(1,'2026-08-31 23:00:00','2026-09-01 06:30:00',4),
(2,'2026-09-01 23:15:00','2026-09-02 06:45:00',4),
(3,'2026-09-02 23:30:00','2026-09-03 06:30:00',3),
(4,'2026-09-03 23:00:00','2026-09-04 06:45:00',4),
(5,'2026-09-04 22:45:00','2026-09-05 06:45:00',5),
(6,'2026-09-05 23:45:00','2026-09-06 07:00:00',4),
(7,'2026-09-06 22:30:00','2026-09-07 06:00:00',5);

INSERT INTO goals
(user_id, goal_name, goal_type, target_value, unit, start_date, end_date, status) VALUES
(1,'Study 30 Hours','Study',30,'hours','2026-09-01','2026-09-30','Active'),
(1,'Exercise 15 Days','Exercise',15,'days','2026-09-01','2026-09-30','Active'),
(1,'Monthly Budget','Budget',5000,'₹','2026-09-01','2026-09-30','Active'),
(2,'Study 25 Hours','Study',25,'hours','2026-09-01','2026-09-30','Active');

INSERT INTO goal_progress (goal_id, progress_date, actual_value) VALUES
(1,'2026-09-01',4.0),
(1,'2026-09-03',10.0),
(1,'2026-09-05',16.5),
(1,'2026-09-07',22.5),
(2,'2026-09-01',1),
(2,'2026-09-03',3),
(2,'2026-09-05',6),
(2,'2026-09-07',9),
(3,'2026-09-01',260),
(3,'2026-09-03',800),
(3,'2026-09-05',1260),
(3,'2026-09-07',1840),
(4,'2026-09-05',2.5),
(4,'2026-09-06',5.5),
(4,'2026-09-07',7.5);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_daily_logs_user_date
ON daily_logs(user_id, log_date);

CREATE INDEX idx_activities_day
ON activities(day_id);

CREATE INDEX idx_activities_category
ON activities(category_id);

CREATE INDEX idx_expenses_day
ON expenses(day_id);

CREATE INDEX idx_study_day
ON study_sessions(day_id);

CREATE INDEX idx_transport_day
ON transport_logs(day_id);

CREATE INDEX idx_screen_day
ON screen_time_logs(day_id);

CREATE INDEX idx_mood_day
ON mood_logs(day_id);

CREATE INDEX idx_sleep_day
ON sleep_logs(day_id);

CREATE INDEX idx_goal_user
ON goals(user_id);

-- ============================================================
-- AUDIT TABLE + TRIGGER
-- ============================================================

CREATE TABLE expense_audit (
    audit_id INT AUTO_INCREMENT PRIMARY KEY,
    expense_id INT NOT NULL,
    action_type VARCHAR(20) NOT NULL,
    amount DECIMAL(10,2),
    action_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DELIMITER $$

CREATE TRIGGER before_activity_insert
BEFORE INSERT ON activities
FOR EACH ROW
BEGIN
    IF NEW.end_time <= NEW.start_time THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Activity end time must be after start time';
    END IF;
END$$

CREATE TRIGGER after_expense_insert
AFTER INSERT ON expenses
FOR EACH ROW
BEGIN
    INSERT INTO expense_audit(expense_id, action_type, amount)
    VALUES (NEW.expense_id, 'INSERT', NEW.amount);
END$$

-- ============================================================
-- VIEWS
-- ============================================================

CREATE VIEW daily_summary AS
SELECT
    d.day_id,
    d.user_id,
    u.full_name,
    d.log_date,
    COALESCE((SELECT SUM(e.amount)
              FROM expenses e
              WHERE e.day_id = d.day_id), 0) AS total_spending,
    COALESCE((SELECT SUM(TIMESTAMPDIFF(MINUTE, s.start_time, s.end_time))
              FROM study_sessions s
              WHERE s.day_id = d.day_id), 0) AS study_minutes,
    COALESCE((SELECT SUM(st.duration_minutes)
              FROM screen_time_logs st
              WHERE st.day_id = d.day_id), 0) AS screen_minutes,
    (SELECT m.mood_score
     FROM mood_logs m
     WHERE m.day_id = d.day_id
     ORDER BY m.mood_id DESC
     LIMIT 1) AS mood_score,
    (SELECT ROUND(TIMESTAMPDIFF(MINUTE, sl.sleep_start, sl.sleep_end) / 60, 2)
     FROM sleep_logs sl
     WHERE sl.day_id = d.day_id
     ORDER BY sl.sleep_id DESC
     LIMIT 1) AS sleep_hours
FROM daily_logs d
JOIN users u ON u.user_id = d.user_id$$

CREATE VIEW weekly_expense_summary AS
SELECT
    u.user_id,
    u.full_name,
    YEARWEEK(d.log_date, 1) AS year_week,
    SUM(e.amount) AS total_spending
FROM users u
JOIN daily_logs d ON d.user_id = u.user_id
JOIN expenses e ON e.day_id = d.day_id
GROUP BY u.user_id, u.full_name, YEARWEEK(d.log_date, 1)$$

-- ============================================================
-- STORED PROCEDURES
-- ============================================================

CREATE PROCEDURE GetDailyReport(
    IN p_user_id INT,
    IN p_date DATE
)
BEGIN
    SELECT
        u.full_name,
        d.log_date,
        COALESCE(SUM(DISTINCT e.amount),0) AS spending
    FROM users u
    JOIN daily_logs d ON d.user_id = u.user_id
    LEFT JOIN expenses e ON e.day_id = d.day_id
    WHERE u.user_id = p_user_id
      AND d.log_date = p_date
    GROUP BY u.full_name, d.log_date;

    SELECT
        s.subject,
        s.topic,
        s.start_time,
        s.end_time,
        TIMESTAMPDIFF(MINUTE, s.start_time, s.end_time) AS duration_minutes,
        s.productivity_rating
    FROM study_sessions s
    JOIN daily_logs d ON d.day_id = s.day_id
    WHERE d.user_id = p_user_id
      AND d.log_date = p_date
    ORDER BY s.start_time;
END$$

CREATE PROCEDURE GetMonthlySpending(
    IN p_user_id INT,
    IN p_year INT,
    IN p_month INT
)
BEGIN
    SELECT
        e.category,
        SUM(e.amount) AS total_amount
    FROM expenses e
    JOIN daily_logs d ON d.day_id = e.day_id
    WHERE d.user_id = p_user_id
      AND YEAR(d.log_date) = p_year
      AND MONTH(d.log_date) = p_month
    GROUP BY e.category
    ORDER BY total_amount DESC;
END$$

DELIMITER ;

-- ============================================================
-- QUICK VERIFICATION
-- ============================================================

SELECT 'LifeLog database created successfully!' AS message;

SHOW TABLES;

SELECT COUNT(*) AS total_users FROM users;
SELECT COUNT(*) AS total_daily_logs FROM daily_logs;
SELECT COUNT(*) AS total_activities FROM activities;
SELECT COUNT(*) AS total_expenses FROM expenses;
SELECT COUNT(*) AS total_study_sessions FROM study_sessions;
SELECT COUNT(*) AS total_goals FROM goals;

-- Example analytical queries:
-- SELECT * FROM daily_summary WHERE user_id = 1 ORDER BY log_date;
-- SELECT * FROM weekly_expense_summary WHERE user_id = 1;
-- CALL GetDailyReport(1, '2026-09-07');
-- CALL GetMonthlySpending(1, 2026, 9);
