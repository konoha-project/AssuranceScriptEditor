<?php
require_once('../config.php');
require_once('../utils.php');
$data = array(
	'method' => 'register',
	'params' => array('userName' => $_POST['name'], 'password' => $_POST['password']),
	'jsonrpc'=> '2.0',
);
echo send_post(json_encode($data),BASEPATH . 'cgi/api.cgi');
?>
