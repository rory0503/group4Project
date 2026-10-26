DROP DATABASE IF EXISTS green_ai;
CREATE DATABASE green_ai
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
USE green_ai;

--Provider

CREATE TABLE Provider (
    ID                INT AUTO_INCREMENT PRIMARY KEY,
    name              VARCHAR(100) NOT NULL UNIQUE,
    Power_Consumption FLOAT NOT NULL DEFAULT 0,
    Co2               FLOAT NOT NULL DEFAULT 0,
    Water_Usage       FLOAT NOT NULL DEFAULT 0
) ENGINE=InnoDB;

--Model

CREATE TABLE Model (
    ID                INT AUTO_INCREMENT PRIMARY KEY,
    Provider_ID       INT NOT NULL,
    Name              VARCHAR(100) NOT NULL,
    Power_Consumption FLOAT NOT NULL DEFAULT 0,
    Co2               FLOAT NOT NULL DEFAULT 0,
    Water_Usage       FLOAT NOT NULL DEFAULT 0,
    CONSTRAINT fk_model_provider
        FOREIGN KEY (Provider_ID) REFERENCES Provider(ID)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT uq_model_per_provider UNIQUE (Provider_ID, Name)
) ENGINE=InnoDB;

--User

CREATE TABLE `User` (
    ID       INT AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(50)  NOT NULL UNIQUE,
    Email    VARCHAR(255) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL, 
    Language VARCHAR(10)  NOT NULL DEFAULT 'en'
) ENGINE=InnoDB;

--Saved_Model

CREATE TABLE Saved_Model (
    Model_ID INT NOT NULL,
    User_ID  INT NOT NULL,
    PRIMARY KEY (Model_ID, User_ID),
    CONSTRAINT fk_saved_model
        FOREIGN KEY (Model_ID) REFERENCES Model(ID)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_saved_user
        FOREIGN KEY (User_ID) REFERENCES `User`(ID)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

--User_Model
CREATE TABLE User_Model (
    ID                INT AUTO_INCREMENT PRIMARY KEY,
    User_ID           INT NOT NULL,
    Name              VARCHAR(100) NOT NULL,
    Power_Consumption FLOAT NOT NULL DEFAULT 0,
    Co2               FLOAT NOT NULL DEFAULT 0,
    Water_Usage       FLOAT NOT NULL DEFAULT 0,
    CONSTRAINT fk_usermodel_user
        FOREIGN KEY (User_ID) REFERENCES `User`(ID)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Metadata

CREATE TABLE Metadata (
    Last_Updated      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                      ON UPDATE CURRENT_TIMESTAMP,
    Power_Consumption FLOAT NOT NULL DEFAULT 0,
    Co2               FLOAT NOT NULL DEFAULT 0,
    Water_Usage       FLOAT NOT NULL DEFAULT 0
) ENGINE=InnoDB;