<ul class="nav pull-right">
	<li class="divider-vertical"></li>
	<li class="dropdown">
    <a class="dropdown-toggle" href="#" data-toggle="dropdown"><?php echo $user_name;?><strong class="caret"></strong></a>
		<div class="dropdown-menu" style="padding: 15px; padding-bottom: 0px;">
			<form id="sign-in-form" class="navbar-form pull-right" method="post" action="action/logout.php">
				<input type="submit" class="btn btn-danger" style="margin-bottom: 15px; width: 100%; height: 32px; font-size: 13px;" value="Sign out">
			</form>
		</div>
	</li>
</ul>
