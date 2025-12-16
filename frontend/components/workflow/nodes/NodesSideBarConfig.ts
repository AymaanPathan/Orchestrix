import AuthMiddlewareNodeEditor from "@/components/NodesEditor/AuthMiddleWareNodeEditor";
import DBDeleteNodeEditor from "@/components/NodesEditor/DBDeleteNodeEditor";
import DBFindNodeEditor from "@/components/NodesEditor/DBFindNodeEditor";
import DBInsertNodeEditor from "@/components/NodesEditor/DBInsertNodeEditor";
import DBUpdateNodeEditor from "@/components/NodesEditor/DBUpdateNodeEditor";
import InputNodeEditor from "@/components/NodesEditor/InputNodeEditor";
import LoginNodeEditor from "@/components/Ui/LoginNodeEditor";

export const editorMap: any = {
  input: InputNodeEditor,
  dbFind: DBFindNodeEditor,
  dbInsert: DBInsertNodeEditor,
  dbUpdate: DBUpdateNodeEditor,
  userLogin: LoginNodeEditor,
  dbDelete: DBDeleteNodeEditor,
  authMiddleware: AuthMiddlewareNodeEditor,
};
