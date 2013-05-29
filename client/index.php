<?php
require_once("config.php");
require_once("utils.php");
require_once("locale.php");
session_start();
if(isset($_COOKIE["userId"])) {
	session_regenerate_id(TRUE);
}
$locales = getLocale("ja");
if(isset($_COOKIE["lang"])) {
	$locales = getLocale($_COOKIE["lang"]);
}
?>
<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AssuranceScriptEditor</title>
<link rel="stylesheet" type="text/css" href="lib/jquery.svg.css"/>
<link rel="stylesheet" type="text/css" href="lib/jquery.ui.autocomplete.css"/>
<link rel="stylesheet" type="text/css" href="lib/jquery.colorPicker.css"/>
<link rel="stylesheet" type="text/css" href="lib/bootstrap.min.css"/>
<link rel="stylesheet" type="text/css" href="lib/bootstrap.icons.css"/>
<link rel="stylesheet" type="text/css" href="lib/bootstrap-responsive.min.css"/>
<link rel="stylesheet" type="text/css" href="lib/codemirror.css"/>
<link rel="stylesheet" type="text/css" href="css/dcase-node.css"/>
<link rel="stylesheet" type="text/css" href="css/viewer.css"/>
<link rel="stylesheet" type="text/css" href="css/timeline.css"/>
<style>
body {
	min-height: 480px;
	margin: 0px;
}
#viewer {
	left: 0px;
	top : 40px;
	width : 100%;
	bottom: 0px;
}
#dcase-manager {
	margin-top: 60px;
}
#ase-logo {
	position: absolute;
	right: 0px;
	top: 40px;
}
</style>
<script type="text/javascript" src="lib/jquery.min.js"></script>
<script type="text/javascript" src="lib/jquery.mousewheel.min.js"></script>
<script type="text/javascript" src="lib/jquery.draggable.min.js"></script>
<script type="text/javascript" src="lib/jquery.svg.min.js"></script>
<script type="text/javascript" src="lib/jquery.svganim.min.js"></script>
<script type="text/javascript" src="lib/jquery.ui.autocomplete.js"></script>
<script type="text/javascript" src="lib/jquery.colorPicker.min.js"></script>
<script type="text/javascript" src="lib/jquery.autosize-min.js"></script>
<script type="text/javascript" src="lib/bootstrap.min.js"></script>
<script type="text/javascript" src="lib/spin.min.js"></script>
<script type="text/javascript" src="lib/codemirror.js"></script>
<script type="text/javascript" src="js/dcaseviewer.js"></script>
<script type="text/javascript" src="js/dcaseviewer-addons.js"></script>
<script type="text/javascript" src="js/dnode.js"></script>
<script type="text/javascript" src="js/dscript.js"></script>
<script type="text/javascript" src="js/gsnshape.js"></script>
<script type="text/javascript" src="js/handler.js"></script>
<script type="text/javascript" src="js/timeline.js"></script>
<script type="text/javascript" src="js/dateformatter.js"></script>
<script type="text/javascript" src="js/ase.js"></script>
<script type="text/javascript" src="js/api.js"></script>
<script type="text/javascript" src="js/animation.js"></script>
<script type="text/javascript">

$(function() {
	var ase = new ASE(document.getElementById("ase"));

	var $id    = $('#signup-userid');
	var $pass1 = $('#signup-pass');
	var $pass2 = $('#signup-pass2');

	var varify = function(){
		if($id.val().length > 0 && $pass1.val().length > 0 && $pass1.val() == $pass2.val()){
			$('#sign-up-form .btn').removeAttr("disabled");
		}else{
			$('#sign-up-form .btn').attr("disabled", "disabled");
		}
	};
	$id.keyup(varify);
	$pass1.keyup(varify);
	$pass2.keyup(varify);
	
	// hide url bar for ipod touch
	setTimeout(function(){
		window.scrollTo(0, 0);
	}, 0);
});
</script>
</head>
<body>

<div class="navbar navbar-inverse navbar-fixed-top">
	<div class="navbar-inner">
		<div class="container">
			<button type="button" class="btn btn-navbar" data-toggle="collapse" data-target=".nav-collapse">
				<span class="icon-bar"></span>
				<span class="icon-bar"></span>
				<span class="icon-bar"></span>
			</button>
			<form id="search-form" class="navbar-search pull-left">
				<input type="text" id="search-query" class="search-query" placeholder="Search">
			</form>
			<div class="nav-collapse collapse">
				<ul class="nav">
<?php
	if(isset($_GET["dcaseId"])){
		echo '<li><a href="./?dcaseId=' . h($_GET["dcaseId"]) . '" id="dcaseName">hogehoge</a></li>';
	}
?>
	<li><a href="./"><?php echo $locales["home"]?></a></li>
					<li class="dropdown ase-edit-menu">
						<a class="dropdown-toggle" data-toggle="dropdown" href="#"><?php echo h($locales["edit"])?><b class="caret"></b></a>
						<ul class="dropdown-menu">
							<li><a id="menu-undo" href="#"><?php echo h($locales["undo"])?></a></li>
							<li><a id="menu-redo" href="#"><?php echo h($locales["redo"])?></a></li>
						</ul>
					</li>
					<li class="dropdown ase-edit-menu ase-view-menu">
						<a class="dropdown-toggle" data-toggle="dropdown" href="#"><?php echo h($locales["export"])?><b class="caret"></b></a>
						<ul class="dropdown-menu">
							<li><a id="menu-export-json" href="#">JSON</a></li>
							<li><a id="menu-export-png" href="#">PNG</a></li>
							<li><a id="menu-export-pdf" href="#">PDF</a></li>
							<li><a id="menu-export-dscript" href="#">D-Script</a></li>
						</ul>
					</li>
					<li class="ase-edit-menu"><a id="menu-commit" href="#"><?php echo h($locales["commit"])?></a></li>
					<li class="dropdown ase-edit-menu ase-view-menu">
						<a class="dropdown-toggle" id="menu-history-toggle" href="#"><?php echo h($locales["commitlog"])?><b class="caret"></b></a>
					</li>
					<li class="dropdown ase-edit-menu ase-view-menu">
						<a class="dropdown-toggle" data-toggle="dropdown" href="#"><?php echo h($locales["config"])?><b class="caret"></b></a>
						<ul class="dropdown-menu">
							<li class="dropdown-submenu">
								<a href="#"><?php echo h($locales["color_theme"])?></a>
								<ul id="menu-change-theme" class="dropdown-menu">
								</ul>
							</li>
							<li class="dropdown-submenu">
								<a href="#"><?php echo h($locales["locale"])?></a>
								<ul id="lang-theme" class="dropdown-menu">
									<li><a id="lang-select-english" href="#">English</a></li>
									<li><a id="lang-select-japanese" href="#">Japanese</a></li>
								</ul>
							</li>
						</ul>
					</li>
				</ul>
<?php

if(!isset($_COOKIE["userId"])&& $_COOKIE["userId"]!==0) {
	require_once('navigation_signin.php');
}else {
	$user_name = h($_COOKIE["userName"]);
	require_once('navigation_signout.php');
}
?>
			</div>
		</div>
	</div>
</div>

<div id="ase" class="container">
	<img id="ase-logo" src="img/assuranceDS.png">
	<div id="viewer" style="display: none;"></div>
	<div id="dcase-manager" class="container-fluid" style="display: none;">
		<div class="row-fluid">
			<div class="span6">
				<h2><?php echo h($locales["new_DCase"])?></h2>
				<form class="form-horizontal">
					<div class="control-group" id="newdcase-name">
						<label class="control-label" for="inputDCaseName"><?php echo h($locales["DCase_name"])?></label>
						<div class="controls">
							<input type="text" id="inputDCaseName">
						</div>
					</div>
					<div class="control-group" id="newdcase-desc">
						<label class="control-label" for="inputDesc"><?php echo h($locales["topgoal"])?></label>
						<div class="controls">
							<textarea id="inputDesc" rows=5></textarea>
						</div>
					</div>
					<div class="control-group">
						<div class="controls">
							<button type="button" class="btn" id="dcase-create"><?php echo h($locales["create"])?></button>
						</div>
					</div>
				</form>
			</div>
			<div class="span6">
				<h2>DCaseを選択</h2>
				<table class="table table-striped table-hover">
					<thead>
						<tr>
							<th><?php echo h($locales["DCase_name"])?></th>
							<th><?php echo h($locales["creater"])?></th>
							<th><?php echo h($locales["last_commit"])?></th>
							<th><?php echo h($locales["last_commiter"])?></th>
							<th>Edit</th>
							<th>Delete</th>
						</tr>
					</thead>
					<tbody id="dcase-select-table">
					</tbody>
				</table>
			</div>
		</div>
	</div>

	<div class="dropdown" id="edit-menulist" style="display: none;">
		<a class="dropdown-toggle" data-toggle="dropdown" href="#"><i class="icon-list"></i></a>
		<ul class="dropdown-menu">
			<li><a id="ml-cut" href="#"><?php echo h($locales["cut"])?></a></li>
			<li><a id="ml-copy" href="#"><?php echo h($locales["copy"])?></a></li>
			<li><a id="ml-paste" href="#"><?php echo h($locales["paste"])?></a></li>
			<li><a id="ml-delete" href="#"><?php echo h($locales["delete"])?></a></li>
			<li class="divider"></li>
			<li><a id="ml-openall" href="#"><?php echo h($locales["openall"])?></a></li>
			<li><a id="ml-closeall" href="#"><?php echo h($locales["closeall"])?></a></li>
			<li class="divider"></li>

			<li class="dropdown-submenu">
				<a tabindex="-1" href="#"><?php echo h($locales["export"])?></a>
				<ul class="dropdown-menu">
					<li><a id="ml-export-json" href="#">JSON</a></li>
					<li><a id="ml-export-png" href="#">PNG</a></li>
					<li><a id="ml-export-pdf" href="#">PDF</a></li>
					<li><a id="ml-export-dscript" href="#">D-Script</a></li>
				</ul>
			</li>
		</ul>
	</div>

	<table id="edit-newnode" style="display: none;">
		<tr><td width="80">
			<ul class="nav nav-list" style="min-height: 100px;">
			</ul>
		</td><td width="200">
			<textarea style="margin: 0px; padding: 0px; width: 100%; height: 100%;"></textarea>
		</td></tr>
	</table>
</div>

<svg width="0" height="0">
<defs>
	<marker id="Triangle-black" viewBox="0 0 10 10" refX="10" refY="5"
		markerUnits="strokeWidth" markerWidth="15" markerHeight="9" orient="auto">
		<path d="M 0 0 L 10 5 L 0 10 z" fill="gray" stroke="gray"></path>
	</marker>
	<marker id="Triangle-white" viewBox="0 0 10 10" refX="10" refY="5"
		markerUnits="strokeWidth" markerWidth="15" markerHeight="9" orient="auto">
		<path d="M 0 0 L 10 5 L 0 10 z" fill="white" stroke="gray"></path>
	</marker>
</defs>
</svg>

</body>
</html>
