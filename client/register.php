<?php
require_once('config.php');
require_once('utils.php');
session_start();
?>
<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>D-CASE VIEWER</title>
<link rel="stylesheet" type="text/css" href="lib/bootstrap.min.css"/>
<link rel="stylesheet" type="text/css" href="lib/bootstrap.icons.css"/>
<link rel="stylesheet" type="text/css" href="lib/bootstrap-responsive.min.css"/>
<script type="text/javascript" src="lib/jquery.min.js"></script>
<script type="text/javascript" src="lib/bootstrap.min.js"></script>
</head>
<body>
	<div class="container">
	<h1>register</h1>
		<form action="action/register.php" method="post">
		<fieldset>
			<label>name</label><input type="text" name="name" /><br>
			<label>password</label><input type="password" name="password" />
			<input type="submit" />
		</fieldset>
		</form>
	</div> <!-- class="container" -->
</body>
</html>
