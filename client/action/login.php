<?php
require_once('../config.php');
require_once('../utils.php');
session_start();
var_dump($_POST);
$data = array(
	'method' => 'login',
	'params' => array('userName' => $_POST['username'], 'password' => $_POST['password']),
	'jsonrpc'=> '2.0',
);
$res = json_decode(send_post(json_encode($data),BASEPATH . 'cgi/api.cgi'));
var_dump($res);
if($res->result->userId !== 0) {
    setcookie("userId", $res->result->userId,0,'/');
    setcookie("userName", $_POST['username'],0,'/');
}
header('Location: '.BASEPATH);
exit();
?>
