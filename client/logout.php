<?php
require_once('config.php');
require_once('utils.php');
session_start();
$_SESSION = array();
setcookie("userId"   ,"",0,"/");
setcookie("userName" ,"",0,"/");
session_destroy();
header('Location: '.BASEPATH);
exit();
?>
