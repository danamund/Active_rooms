-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: localhost    Database: active_rooms
-- ------------------------------------------------------
-- Server version	9.2.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `area_room`
--

DROP TABLE IF EXISTS `area_room`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `area_room` (
  `area_id` varchar(10) NOT NULL,
  `room_id` varchar(10) NOT NULL,
  `room_name` int DEFAULT NULL,
  PRIMARY KEY (`area_id`,`room_id`),
  KEY `room_id` (`room_id`),
  CONSTRAINT `area_room_ibfk_2` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `area_room`
--

LOCK TABLES `area_room` WRITE;
/*!40000 ALTER TABLE `area_room` DISABLE KEYS */;
INSERT INTO `area_room` VALUES ('201','1201',201),('202','2201',201),('203','3201',201),('203','3401',401),('204','4101',101),('205','5220',220),('206','6101',101),('206','6216',216),('207','7103',103),('207','7201',201),('207','7401',401),('208','8201',201),('208','8300',300),('208','8401',401),('38','29',888),('38','5585',58),('389','0515',60),('39','555',60);
/*!40000 ALTER TABLE `area_room` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `areas`
--

DROP TABLE IF EXISTS `areas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `areas` (
  `id` varchar(10) NOT NULL,
  `name` varchar(100) NOT NULL,
  `map_code` varchar(20) NOT NULL DEFAULT 'HIT',
  `description` text,
  `path` varchar(200) DEFAULT NULL,
  `restriction` tinyint DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `areas`
--

LOCK TABLES `areas` WRITE;
/*!40000 ALTER TABLE `areas` DISABLE KEYS */;
INSERT INTO `areas` VALUES ('201',' Building 1','HIT MAP CAMPUS','Default description',NULL,0),('202',' Building 2','HIT MAP CAMPUS','Default description',NULL,0),('203',' Building 3','HIT MAP CAMPUS','Default description',NULL,0),('204',' Building 4','HIT MAP CAMPUS','Default description',NULL,0),('205',' Building 5','HIT MAP CAMPUS','Default description',NULL,0),('206',' Building 6','HIT MAP CAMPUS','Default description',NULL,0),('207',' Building 7','HIT MAP CAMPUS','Default description',NULL,0),('208',' Building 8','HIT MAP CAMPUS','Default description',NULL,0),('209','Labs','HIT MAP CAMPUS','Default description',NULL,0),('38','Building 1','568','Default description',NULL,0),('389','Labs2','568','Default description',NULL,0),('39','Building 9','zone 2','Default description',NULL,0);
/*!40000 ALTER TABLE `areas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rooms`
--

DROP TABLE IF EXISTS `rooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rooms` (
  `id` varchar(10) NOT NULL,
  `description` text,
  `area` int DEFAULT NULL,
  `x` int DEFAULT NULL,
  `y` int DEFAULT NULL,
  `floor` int DEFAULT NULL,
  `room_name` int DEFAULT NULL,
  `map_code` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rooms`
--

LOCK TABLES `rooms` WRITE;
/*!40000 ALTER TABLE `rooms` DISABLE KEYS */;
INSERT INTO `rooms` VALUES ('0515','Default description',389,700,450,2,60,'568'),('1201','Default description',201,96,55,2,201,'HIT MAP CAMPUS'),('2201','Default description',202,85,102,2,201,'HIT MAP CAMPUS'),('2208','Labs outside',NULL,271,288,2,208,'568'),('29','Default description',38,99,83,2,888,'568'),('292','Lab num 3',NULL,353,447,4,554,'zone 2'),('2922','Lab num 1',NULL,252,422,NULL,22,'568'),('3201','Default description',203,102,191,2,201,'HIT MAP CAMPUS'),('3401','Default description',203,103,218,4,401,'HIT MAP CAMPUS'),('4101','Default description',204,240,180,1,101,'HIT MAP CAMPUS'),('5220','Default description',205,269,342,2,220,'HIT MAP CAMPUS'),('555','Labs outside',39,200,153,2,60,'zone 2'),('5585','Lab num 1',38,164,359,NULL,58,'568'),('6101','Default description',206,554,356,1,101,'HIT MAP CAMPUS'),('6216','Default description',206,516,389,2,216,'HIT MAP CAMPUS'),('666','Lab num 1',NULL,304,248,NULL,60,'HIT MAP CAMPUS'),('667','Lab num 2',NULL,322,273,NULL,61,'HIT MAP CAMPUS'),('668','Lab num 3',NULL,265,230,NULL,62,'HIT MAP CAMPUS'),('7103','Default description',207,700,386,1,103,'HIT MAP CAMPUS'),('7201','Default description',207,662,356,2,201,'HIT MAP CAMPUS'),('7401','Default description',207,649,437,4,401,'HIT MAP CAMPUS'),('8201','Default description',208,232,492,2,201,'HIT MAP CAMPUS'),('8300','Default description',208,297,457,3,300,'HIT MAP CAMPUS'),('8401','Default description',208,236,453,4,401,'HIT MAP CAMPUS');
/*!40000 ALTER TABLE `rooms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sensors`
--

DROP TABLE IF EXISTS `sensors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sensors` (
  `id` varchar(10) NOT NULL,
  `room_id` varchar(10) DEFAULT NULL,
  `x` int NOT NULL,
  `y` int NOT NULL,
  `status` enum('available','occupied','error') DEFAULT 'available',
  `map_code` varchar(50) DEFAULT 'default',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `room_id` (`room_id`),
  CONSTRAINT `fk_sensors_rooms` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sensors`
--

LOCK TABLES `sensors` WRITE;
/*!40000 ALTER TABLE `sensors` DISABLE KEYS */;
INSERT INTO `sensors` VALUES ('S100',NULL,229,328,'available','zone 2','2025-09-04 11:38:46','2025-09-04 11:38:46'),('S101','1201',96,55,'available','HIT MAP CAMPUS','2025-09-03 21:16:00','2025-09-03 21:16:00'),('S102','2201',85,102,'available','HIT MAP CAMPUS','2025-09-03 21:16:46','2025-09-03 21:16:46'),('S103','3401',103,218,'occupied','HIT MAP CAMPUS','2025-09-03 21:17:37','2025-09-03 21:17:37'),('S104','3201',102,191,'available','HIT MAP CAMPUS','2025-09-03 21:18:07','2025-09-03 21:18:07'),('S105','4101',240,180,'available','HIT MAP CAMPUS','2025-09-03 21:19:15','2025-09-03 21:19:15'),('S107','6101',554,356,'occupied','HIT MAP CAMPUS','2025-09-03 21:44:45','2025-09-03 21:44:45'),('S108','6216',516,389,'available','HIT MAP CAMPUS','2025-09-03 21:45:18','2025-09-03 21:45:18'),('S109','7103',700,386,'error','HIT MAP CAMPUS','2025-09-03 21:59:02','2025-09-03 21:59:02'),('S110','7201',662,356,'available','HIT MAP CAMPUS','2025-09-03 21:59:11','2025-09-03 21:59:11'),('S111','7401',649,437,'occupied','HIT MAP CAMPUS','2025-09-03 21:59:23','2025-09-03 21:59:23'),('S112','8300',297,457,'occupied','HIT MAP CAMPUS','2025-09-03 22:00:52','2025-09-03 22:00:52'),('S113','8401',236,453,'occupied','HIT MAP CAMPUS','2025-09-03 22:01:03','2025-09-03 22:01:03'),('S114','8201',232,492,'error','HIT MAP CAMPUS','2025-09-03 22:01:18','2025-09-03 22:01:18'),('S115','666',304,248,'error','HIT MAP CAMPUS','2025-09-03 22:20:40','2025-09-03 22:20:40'),('S116','667',322,273,'occupied','HIT MAP CAMPUS','2025-09-03 22:20:52','2025-09-03 22:20:52'),('S117','668',265,230,'available','HIT MAP CAMPUS','2025-09-03 22:21:02','2025-09-03 22:21:02'),('S150','29',99,83,'available','568','2025-09-04 13:12:51','2025-09-04 13:12:51'),('S222','292',353,447,'occupied','zone 2','2025-09-04 00:10:04','2025-09-04 00:30:37'),('S280','0515',700,450,'error','568','2025-09-04 13:19:34','2025-09-04 13:28:26'),('S288','555',200,153,'error','zone 2','2025-09-04 00:29:10','2025-09-04 00:29:21'),('S400','5585',164,359,'available','568','2025-09-04 13:20:48','2025-09-04 13:21:12'),('S540',NULL,415,317,'error','568','2025-09-04 13:14:04','2025-09-04 13:14:04'),('S877','2922',252,422,'error','568','2025-09-04 01:12:27','2025-09-04 01:12:35'),('S885','5220',269,342,'occupied','HIT MAP CAMPUS','2025-09-03 21:35:42','2025-09-03 21:36:36'),('S998','2208',271,288,'occupied','568','2025-09-04 01:11:04','2025-09-04 13:01:20');
/*!40000 ALTER TABLE `sensors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(10) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(100) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `role` tinyint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('U001','admin','admin123','admin@hit.ac.il','054-1234567',1),('U002','user','user123','user@hit.ac.il','054-7654321',0),('U003','manager','manager123','manager@hit.ac.il','054-9876543',1),('U004','student','student123','student@hit.ac.il','054-5555555',0);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `zones`
--

DROP TABLE IF EXISTS `zones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `zones` (
  `map_code` varchar(20) NOT NULL,
  `path` varchar(100) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`map_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `zones`
--

LOCK TABLES `zones` WRITE;
/*!40000 ALTER TABLE `zones` DISABLE KEYS */;
INSERT INTO `zones` VALUES ('568','568.jpg','2025-09-04 01:10:32','2025-09-04 01:10:32'),('HIT MAP CAMPUS','HIT MAP CAMPUS.jpg','2025-09-03 21:12:01','2025-09-03 21:12:01'),('zone 2','zone 2.jpg','2025-09-03 23:50:05','2025-09-03 23:50:05');
/*!40000 ALTER TABLE `zones` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-09-04 16:29:25
