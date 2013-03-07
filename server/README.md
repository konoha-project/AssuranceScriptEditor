# DCase Cloud
---
##開発環境
* Ubuntu 12.04(amd64)
* konoha3

##必要なライブラリ
* MySQL

##必要なソフトウェア
* Apache

データ構造
===============
* Tree       = Json;
* commitId   = int;
* argumentId = int;
* userId     = int;

API(仮なので、今後変更する予定です)
================
* {commitId,argumentId} createTopGoal(Tree tree, userId user\_id);
* Tree getNodeTree(commitId n);
* commitId commit(Tree tree, commitId old, userId user\_id);
* Array[commitId] search(String text); //FIXME
* argumentId[] getArgumentList();
* Array[commitId] getCommitList(commitId n);

###Search系の改正案
* NodeId[] FindNodeFrom(NodeType, NodeIdSearchFrom)
* NodeId[] FindNodeByDescription(SearchText)
* NodeId[] FindContextByProperty(SearchText)

## Usage
test/ ディレクトリ参照<br>
misc/DCaseCloud.sql ... DCaseDBのテーブル作成用クエリ<br>
