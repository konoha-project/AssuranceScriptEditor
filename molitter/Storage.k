import("Konoha.NameSpace");
import("Konoha.Map");
import("Type.Bytes");
import("Type.Json");
import("Lib.Libevent");
import("JavaStyle.Object");
import("Java.String");
import("JavaScript.String");
import("JavaScript.Array");
import("Syntax.Null");
import("Syntax.CStyleWhile");
import("Syntax.JavaStyleClass");

class Storage {
    boolean store(String path, String data) {
        return false;
    }
    String load(String path) {
        return "";
    }
}

class GitStorage extends Storage {
}

class CMISStorage extends Storage {
}
