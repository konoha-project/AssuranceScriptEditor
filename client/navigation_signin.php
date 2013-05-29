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
				<?php echo '<input type="hidden" name="dcaseId" value="{$_GET["dcaseId"]}">'?>
				<input id="user_remember_me" style="float: left; margin-right: 10px;" type="checkbox" name="user[remember_me]" value="1" />
				<label class="string optional" for="user_remember_me"> Remember me</label>

				<input type="submit" class="btn btn-primary" style="margin-bottom: 15px; clear: left; width: 100%; height: 32px; font-size: 13px;" value="Sign in">
			</form>
		</div>
	</li>
</ul>
