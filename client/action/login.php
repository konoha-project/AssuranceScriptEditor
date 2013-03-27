<?php
require_once('../config.php');
require_once('../utils.php');
session_start();
//var_dump($_POST);
$data = array(
	'method' => 'login',
	'params' => array('userName' => $_POST['username'], 'password' => $_POST['password']),
	'jsonrpc'=> '2.0',
);
$res = json_decode(send_post(json_encode($data),BASEPATH . 'cgi/api.cgi'));

$expire_time = 0;
if(isset($_POST["user"])) {
	$expire_time = time()+60*60*24*30;
}
if($res->result->userId !== 0) {
	setcookie("userId", $res->result->userId,$expire_time,'/');
	setcookie("userName", $_POST['username'],$expire_time,'/');
}

if(isset($_POST["dcaseId"])) {
	if($_POST["dcaseId"]>0) {
		header('Location: '.BASEPATH. "?dcaseId={$_POST['dcaseId']}");
		exit();
	}
}
header('Location: '.BASEPATH);
exit();
?>
