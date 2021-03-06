<?php
function getLocaleJP() {
	return array(
		"home"        => "ホーム",
		"edit"        => "編集",
		"undo"        => "元に戻す",
		"redo"        => "やり直し",
		"export"      => "エクスポート",
		"JSON"        => "JSON",
		"PNG"         => "PNG",
		"PDF"         => "PDF",
		"DScript"     => "D-Script",
		"commit"      => "コミット",
		"commitlog"   => "コミット履歴",
		"config"      => "設定",
		"color_theme" => "カラーテーマの変更",
		"locale"      => "言語の変更",
		"new_DCase"   => "新しいD-Caseを作成する",
		"DCase_name"  => "D-Case名",
		"creater"     => "作成者",
		"topgoal"     => "TopGoalの説明",
		"last_commit" => "最終コミット日時",
		"last_commiter" => "最終コミット者",
		"create"      => "作成",
		"cut"         => "切り取り",
		"copy"        => "コピー",
		"paste"       => "貼り付け",
		"delete"      => "削除",
		"openall"     => "全て開く",
		"closeall"    => "全て折りたたむ",
		"locale"      => "言語設定",
	);
}

function getLocale($lang) {
	if($lang=="ja") {
		return getLocaleJP();
	}
	$locales = array(
		"home"        => "Home",
		"edit"        => "Edit",
		"undo"        => "Undo",
		"redo"        => "Redo",
		"export"      => "Export",
		"JSON"        => "JSON",
		"PNG"         => "PNG",
		"PDF"         => "PDF",
		"DScript"     => "D-Script",
		"commit"      => "Commit",
		"commitlog"   => "History",
		"config"      => "Configuration",
		"color_theme" => "Theme",
		"locale"      => "Language",
		"new_DCase"   => "create new D-Case",
		"DCase_name"  => "D-Case Name",
		"topgoal"     => "Description of the Top Goal",
		"create"      => "create",
		"creater"     => "owner",
		"last_commit" => "Last commit date",
		"last_commiter" => "Last commiter",
		"cut"         => "cut",
		"paste"       => "paste",
		"copy"        => "copy",
		"delete"      => "delete",
		"openall"     => "open all",
		"closeall"    => "close all",
		"locale"      => "Language",
	);
	return $locales;
}

?>
