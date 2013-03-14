<?php
require_once('../config.php');
require_once('../utils.php');
session_start();
$_SESSION = array();
setcookie("userId"   ,"",0,"/");
setcookie("userName" ,"",0,"/");
session_destroy();
if(isset($_POST["dcaseId"])) {
	header('Location: '.BASEPATH. "?dcaseId={$_POST['dcaseId']}");
	exit();
}
header('Location: '.BASEPATH);
exit();
?>
