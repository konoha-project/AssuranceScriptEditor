<?php
require_once('../config.php');
require_once('../utils.php');
session_start();
$data = array(
	//'method' => 'register',
	'method' => 'login',
	'params' => array('userName' => 'hoge', 'password' => 'fuga'),
	'jsonrpc'=> '2.0',
);

$res = json_decode(send_post(json_encode($data),BASEPATH . 'cgi/api.cgi'));
echo $res->result->userId;
?>
