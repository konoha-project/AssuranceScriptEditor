SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL,ALLOW_INVALID_DATES';

CREATE SCHEMA IF NOT EXISTS `dcase` DEFAULT CHARACTER SET utf8 ;
USE `dcase` ;

-- -----------------------------------------------------
-- Table `dcase`.`user`
-- -----------------------------------------------------
CREATE  TABLE IF NOT EXISTS `dcase`.`user` (
  `id` INT NOT NULL AUTO_INCREMENT ,
  `user_name` VARCHAR(45) NULL ,
  `password_hash` VARCHAR(255) NULL ,
  `created_at` TIMESTAMP NULL ,
  PRIMARY KEY (`id`) ,
  UNIQUE INDEX `user_name_UNIQUE` (`user_name` ASC) )
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `dcase`.`dcase`
-- -----------------------------------------------------
CREATE  TABLE IF NOT EXISTS `dcase`.`dcase` (
  `id` INT NOT NULL AUTO_INCREMENT ,
  `name` VARCHAR(255) NULL ,
  `user_id` INT NOT NULL ,
  `delete_flag` TINYINT(1) NULL DEFAULT FALSE ,
  PRIMARY KEY (`id`) ,
  INDEX `fk_Argument_user1_idx` (`user_id` ASC) ,
  CONSTRAINT `fk_Argument_user1`
    FOREIGN KEY (`user_id` )
    REFERENCES `dcase`.`user` (`id` )
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `dcase`.`commit`
-- -----------------------------------------------------
CREATE  TABLE IF NOT EXISTS `dcase`.`commit` (
  `id` INT NOT NULL AUTO_INCREMENT ,
  `data` TEXT NULL DEFAULT NULL ,
  `date_time` BIGINT NULL ,
  `prev_commit_id` INT NULL ,
  `latest_flag` TINYINT(1) NULL DEFAULT TRUE ,
  `message` TEXT NULL ,
  `dcase_id` INT NOT NULL ,
  `user_id` INT NOT NULL ,
  PRIMARY KEY (`id`) ,
  INDEX `fk_Commit_Argument` (`dcase_id` ASC) ,
  INDEX `fk_Commit_user1_idx` (`user_id` ASC) ,
  CONSTRAINT `fk_Commit_Argument`
    FOREIGN KEY (`dcase_id` )
    REFERENCES `dcase`.`dcase` (`id` )
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Commit_user1`
    FOREIGN KEY (`user_id` )
    REFERENCES `dcase`.`user` (`id` )
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `dcase`.`node`
-- -----------------------------------------------------
CREATE  TABLE IF NOT EXISTS `dcase`.`node` (
  `id` INT NOT NULL AUTO_INCREMENT ,
  `this_node_id` INT NULL ,
  `description` TEXT NULL ,
  `node_type` VARCHAR(45) NULL ,
  `commit_id` INT NOT NULL ,
  PRIMARY KEY (`id`) ,
  INDEX `fk_node_commit1_idx` (`commit_id` ASC) ,
  CONSTRAINT `fk_node_commit1`
    FOREIGN KEY (`commit_id` )
    REFERENCES `dcase`.`commit` (`id` )
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;



SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
