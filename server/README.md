# AssuranceScriptEditor Server
---
##開発環境
* Ubuntu 12.04(amd64)
* konoha3

##必要なライブラリ
* libMySQLclient

##必要なソフトウェア
* Apache
* MySQL

---

#データ構造
* DCase = { dcaseId: dcaseId, dcaseName: String }
* Tree = Json
* Commit = { commitId: commitId, userId: userId, userName: String, commitMessage: String, time: int }
* SearchResult = { dcaseId: dcaseId, nodeId: nodeId }

API
================

## DCase管理
* getDCaseList() return dcaseList: Array[DCase]
* createDCase(dcaseName: String, userId: int, tree: Tree) return { commitId, dcaseId }

## コミット管理
* getCommitList(dcaseId: dcaseId) return commitList: Array[Commit]
* commit(tree: Tree, commitMessage: String, commitId: commitId, userId:userId) return commitId

## ノード取得
* getNodeTree(commitId: commitId) return tree: Tree

## ログイン
* login(userName: String, password: String)
* register(userName: String, password: String)

## 検索(暫定)
* searchDCase(text: String) return searchResultList: Array[SearchResult]

###Search系の改正案
* ノードの種類

## Usage
test/ ディレクトリ参照<br>
misc/ASEserver.sql ... テーブル作成用クエリ<br>
