<?php
require_once("config.php");
require_once("utils.php");
session_start();
if(isset($_COOKIE["userId"])) {
	session_regenerate_id(TRUE);
}
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
<script type="text/javascript" src="lib/bootstrap.min.js"></script>
<script type="text/javascript" src="lib/spin.min.js"></script>
<script type="text/javascript" src="lib/codemirror.js"></script>
<script type="text/javascript" src="js/dcaseviewer.js"></script>
<script type="text/javascript" src="js/dcaseviewer-addons.js"></script>
<script type="text/javascript" src="js/dnode.js"></script>
<script type="text/javascript" src="js/dscript.js"></script>
<script type="text/javascript" src="js/gsnshape.js"></script>
<script type="text/javascript" src="js/handler.js"></script>
<script type="text/javascript" src="js/edit.js"></script>
<script type="text/javascript" src="js/timeline.js"></script>
<script type="text/javascript" src="js/ase.js"></script>
<script type="text/javascript" src="js/api.js"></script>
<script type="text/javascript" src="js/animation.js"></script>
<script type="text/javascript">

function getURLParameter(name) {
	return decodeURI(
		(RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]
	);
}

$(function() {
	var dcaseId = parseInt(getURLParameter("dcaseId"));
	if(isNaN(dcaseId)) dcaseId = 0;
	var ase = new ASE(document.getElementById("ase"), dcaseId);

	var searchQuery = $('#search-query');
	searchQuery.popover({
		html: true,
		placement: 'bottom',
		trigger: 'manual',
		content: function(){
			var wrapper = $('<div id="search_result_wrapper">');
			$('<a class="btn btn-link">close</a>').click(function(){
				searchQuery.popover('hide');
				return false;
			}).appendTo(wrapper);
			wrapper.append('<ul id="search_result_ul" class="unstyled">');
			wrapper.width(searchQuery.width());
			return wrapper;
		},
	});
	$('#search-form').submit(function(){
		var query = searchQuery.val();
		if(query.length > 0){
			ase.updateSearchResult(query);
		}
		return false;
	});

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
					<li class="dropdown">
						<a class="dropdown-toggle" data-toggle="dropdown" href="#">DCaseの選択<b class="caret"></b></a>
						<ul class="dropdown-menu" id="menu-dcase">
						</ul>
					</li>
<?php
if(!(!isset($_COOKIE["userId"])&& $_COOKIE["userId"]!==0)) {
echo <<<EOT
					<li class="dropdown">
						<a class="dropdown-toggle" data-toggle="dropdown" href="#">編集<b class="caret"></b></a>
						<ul class="dropdown-menu">
							<li><a id="menu-undo" href="#">元に戻す</a></li>
							<li><a id="menu-redo" href="#">やり直し</a></li>
							<li><a id="menu-copy" href="#">コピー</a></li>
							<li><a id="menu-paste" href="#">貼り付け</a></li>
						</ul>
					</li>
					<li class="dropdown">
						<a class="dropdown-toggle" data-toggle="dropdown" href="#">エクスポート<b class="caret"></b></a>
						<ul class="dropdown-menu">
							<li><a id="menu-export-json" href="#">JSON</a></li>
							<li><a id="menu-export-png" href="#">PNG</a></li>
							<li><a id="menu-export-pdf" href="#">PDF</a></li>
							<li><a id="menu-export-dscript" href="#">D-Script</a></li>
						</ul>
					</li>
					<li><a id="menu-commit" href="#">コミット</a></li>

EOT;
}
?>
					<li class="dropdown">
						<a class="dropdown-toggle" id="menu-history-toggle" href="#">コミット履歴<b class="caret"></b></a>
					</li>

					<li class="dropdown">
						<a class="dropdown-toggle" data-toggle="dropdown" href="#">設定<b class="caret"></b></a>
						<ul class="dropdown-menu">
							<li class="dropdown-submenu">
								<a href="#">カラーテーマの変更</a>
								<ul id="menu-change-theme" class="dropdown-menu">
								</ul>
							</li>
						</ul>
					</li>
				</ul>
<?php
if(!isset($_COOKIE["userId"])&& $_COOKIE["userId"]!==0) {
echo <<<EOT
				<ul class="nav pull-right">
					<li class="dropdown">
						<a class="dropdown-toggle" href="#" data-toggle="dropdown">Sign Up <strong class="caret"></strong></a>
						<div class="dropdown-menu" style="padding: 15px; padding-bottom: 0px;">
							<form id="sign-up-form" class="navbar-form pull-right" method="post" action="action/register.php">
								<input id="signup-userid" class="span2" type="text" placeholder="username" name="username" style="margin-bottom: 15px;">
								<input id="signup-pass" class="span2" type="password" placeholder="password" name="password" style="margin-bottom: 15px;">
								<input id="signup-pass2" class="span2" type="password" placeholder="confirm password" name="password2" style="margin-bottom: 15px;">
   
								<input type="submit" class="btn btn-primary" style="margin-bottom: 15px; width: 100%; height: 32px; font-size: 13px;" value="Sign Up" disabled>
							</form>
						</div>
					</li>
					<li class="divider-vertical"></li>
					<li class="dropdown">
						<a class="dropdown-toggle" href="#" data-toggle="dropdown">Sign In <strong class="caret"></strong></a>
						<div class="dropdown-menu" style="padding: 15px; padding-bottom: 0px;">
							<form id="sign-in-form" class="navbar-form pull-right" method="post" action="action/login.php">
								<input class="span2" type="text" placeholder="username" name="username" style="margin-bottom: 15px;">
								<input class="span2" type="password" placeholder="password" name="password" style="margin-bottom: 15px;">
								<input id="user_remember_me" style="float: left; margin-right: 10px;" type="checkbox" name="user[remember_me]" value="1" />
								<label class="string optional" for="user_remember_me"> Remember me</label>
   
								<input type="submit" class="btn btn-primary" style="margin-bottom: 15px; clear: left; width: 100%; height: 32px; font-size: 13px;" value="Sign in">
							</form>
						</div>
					</li>
				</ul>

EOT;
}else{
$user_name = h($_COOKIE["userName"]);
echo <<<EOT
				<ul class="nav pull-right">
					<li class="divider-vertical"></li>
					<li class="dropdown">
						<a class="dropdown-toggle" href="#" data-toggle="dropdown">{$user_name} <strong class="caret"></strong></a>
						<div class="dropdown-menu" style="padding: 15px; padding-bottom: 0px;">
							<form id="sign-in-form" class="navbar-form pull-right" method="post" action="action/login.php">
								<input type="submit" class="btn btn-danger" style="margin-bottom: 15px; width: 100%; height: 32px; font-size: 13px;" value="Sign out" onclick="location.href='logout.php'">
							</form>
						</div>
					</li>
				</ul>
EOT;
}
?>
			</div>
		</div>
	</div>
</div>

<div id="ase" class="container">
	<img id="ase-logo" src="img/assuranceDS.png">
	<div id="viewer" style="display: none;"></div>
	<div id="dcase-manager" class="container-fluid">
		<div class="row-fluid">
			<div class="span6">
				<h2>DCase新規作成</h2>
				<form class="form-horizontal">
					<div class="control-group">
						<label class="control-label" for="inputDCaseName">DCase名</label>
						<div class="controls">
							<input type="text" id="inputDCaseName">
						</div>
					</div>
					<div class="control-group">
						<label class="control-label" for="inputDesc">TopGoalの説明</label>
						<div class="controls">
							<textarea id="inputDesc" rows=5></textarea>
						</div>
					</div>
					<div class="control-group">
						<div class="controls">
							<button type="submit" class="btn">作成</button>
						</div>
					</div>
				</form>
			</div>
			<div class="span6">
				<h2>DCaseを選択</h2>
				<table class="table table-striped table-hover">
					<thead>
						<tr>
							<th>DCase名</th>
							<th>作成者</th>
							<th>最終コミット日時</th>
							<th>最終コミット者</th>
						</tr>
					</thead>
					<tbody>
						<tr><td><a href="./?dcaseId=1">てすと</a></td><td>user</td><td>1/23</td><td>?</td></tr>
						<tr><td><a href="./?dcaseId=2">てすと</a></td><td>user</td><td>1/23</td><td>?</td></tr>
						<tr><td><a href="./?dcaseId=3">てすと</a></td><td>user</td><td>1/23</td><td>?</td></tr>
						<tr><td><a href="./?dcaseId=4">てすと</a></td><td>user</td><td>1/23</td><td>?</td></tr>
						<tr><td><a href="./?dcaseId=5">てすと</a></td><td>user</td><td>1/23</td><td>?</td></tr>
					</tbody>
				</table>
			</div>
		</div>
	</div>

	<table id="edit-newnode" style="display: none;">
		<tr><td width="80">
			<ul class="nav nav-list">
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
		<path d="M 0 0 L 10 5 L 0 10 z" fill="gray" stroke="gray"/>
	</marker>
	<marker id="Triangle-white" viewBox="0 0 10 10" refX="10" refY="5"
		markerUnits="strokeWidth" markerWidth="15" markerHeight="9" orient="auto">
		<path d="M 0 0 L 10 5 L 0 10 z" fill="white" stroke="gray"/>
	</marker>
</defs>
</svg>

</body>
</html>
