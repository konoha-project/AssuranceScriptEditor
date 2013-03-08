<?php  if ( ! defined('BASEPATH')) exit('No direct script access allowed');

if ( ! function_exists('h'))
{
	function h($str)
	{
		return htmlspecialchars($str,ENT_QUOTES,"UTF-8");
	}
}

if ( ! function_exists('send_post'))
{
	function send_post($data,$url)
	{
		//$data = http_build_query($data, "", "&");

		//header
		$header = array(
			"Content-Type: application/x-www-form-urlencoded",
			"Content-Length: ".strlen($data)
		);

		$context = array(
			"http" => array(
				"method"  => "POST",
				"header"  => implode("\r\n", $header),
				"content" => $data
			)
		);

		return file_get_contents($url, false, stream_context_create($context));
	}
}

?>
