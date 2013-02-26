SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL';

CREATE SCHEMA IF NOT EXISTS `dcase` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci ;
USE `dcase` ;

-- -----------------------------------------------------
-- Table `dcase`.`Argument`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `dcase`.`Argument` ;

CREATE  TABLE IF NOT EXISTS `dcase`.`Argument` (
  `argument_id` INT NOT NULL AUTO_INCREMENT ,
  PRIMARY KEY (`argument_id`) )
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `dcase`.`Commit`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `dcase`.`Commit` ;

CREATE  TABLE IF NOT EXISTS `dcase`.`Commit` (
  `idCommit` INT NOT NULL AUTO_INCREMENT ,
  `Data` TEXT NULL ,
  `DateTime` BIGINT NULL ,
  `prev_commit_id` INT NULL ,
  `latest_flag` TINYINT(1) NULL DEFAULT TRUE ,
  `argument_id` INT NOT NULL ,
  PRIMARY KEY (`idCommit`) ,
  INDEX `fk_Commit_Argument` (`argument_id` ASC) ,
  CONSTRAINT `fk_Commit_Argument`
    FOREIGN KEY (`argument_id` )
    REFERENCES `dcase`.`Argument` (`argument_id` )
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;



SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
