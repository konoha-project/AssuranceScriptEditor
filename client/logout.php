<?php
require_once('config.php');
require_once('utils.php');
session_start();
$_SESSION = array();
setcookie("userId"   ,"",0,"/");
setcookie("userName" ,"",0,"/");
session_destroy();
?>
<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>D-CASE VIEWER</title>
<link rel="stylesheet" type="text/css" href="lib/jquery.svg.css"/>
<link rel="stylesheet" type="text/css" href="lib/jquery.ui.autocomplete.css"/>
<link rel="stylesheet" type="text/css" href="lib/jquery.colorPicker.css"/>
<link rel="stylesheet" type="text/css" href="lib/bootstrap.min.css"/>
<link rel="stylesheet" type="text/css" href="lib/bootstrap.icons.css"/>
<link rel="stylesheet" type="text/css" href="lib/bootstrap-responsive.min.css"/>
<link rel="stylesheet" type="text/css" href="lib/codemirror.css"/>
<link rel="stylesheet" type="text/css" href="css/dcase-node.css"/>
<link rel="stylesheet" type="text/css" href="css/viewer.css"/>
<link rel="stylesheet" type="text/css" href="css/edit.css"/>
<link rel="stylesheet" type="text/css" href="css/timeline.css"/>

<script type="text/javascript" src="lib/jquery.min.js"></script>
<script type="text/javascript" src="lib/jquery.mousewheel.min.js"></script>
<script type="text/javascript" src="lib/jquery.draggable.min.js"></script>
<script type="text/javascript" src="lib/jquery.svg.min.js"></script>
<script type="text/javascript" src="lib/jquery.svganim.min.js"></script>
<script type="text/javascript" src="lib/jquery.ui.autocomplete.js"></script>
<script type="text/javascript" src="lib/jquery.colorPicker.min.js"></script>
<script type="text/javascript" src="lib/bootstrap.min.js"></script>
<script type="text/javascript" src="lib/spin.min.js"></script>
<script type="text/javascript" src="lib/codemirror.js"></script>
<script type="text/javascript" src="js/dcaseviewer.js"></script>
<script type="text/javascript" src="js/dnode.js"></script>
<script type="text/javascript" src="js/dscript.js"></script>
<script type="text/javascript" src="js/gsnshape.js"></script>
<script type="text/javascript" src="js/handler.js"></script>
<script type="text/javascript" src="js/edit.js"></script>
<script type="text/javascript" src="js/timeline.js"></script>
<script type="text/javascript" src="js/sidemenu.js"></script>
<script type="text/javascript" src="js/api.js"></script>
<script type="text/javascript" src="js/animation.js"></script>
<script type="text/javascript" src="js/operation.js"></script>
</head>
<body>
	<div class="container">
	<h1>logoutしました.</h1>
	<a href="index.php">戻る</a>
	</div> <!-- class="container" -->
</body>
</html>
