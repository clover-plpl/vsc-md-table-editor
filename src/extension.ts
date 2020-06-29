// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { CompletionItem, languages, ExtensionContext, TextDocument, Position } from 'vscode';
import { MdTableEditor } from './MdTableEditor';
let mdTableEditor: MdTableEditor | undefined;



export async function activate(context: ExtensionContext)
{

	try
	{
		mdTableEditor = new MdTableEditor(context);
		await mdTableEditor.initialize();
	}
	catch(err)
	{
		console.log(err);
	}
	
	// TODO: 緊急追加、いづれ適切な場所に移す。
	context.subscriptions.push(languages.registerCompletionItemProvider(
		'markdown',
		{
			provideCompletionItems: (doc: TextDocument, pos: Position) =>
			{
				if(pos.character === 2)
				{
					const txt = doc.lineAt(pos.line).text.substr(0, 2);
					const nbr = Number(txt.charAt(0));

					if(!isNaN(nbr) && txt.charAt(1) === 'x')
					{
						return [...Array(9).keys()].map(_ => {

							const len = _ + 1;
							const line = '|' + 'x'.repeat(nbr).split('').join('|') + '|';
							const row = line.replace(/x/g, '   ');
							const alignment = line.replace(/x/g, '---');

							const table = [
								row,
								alignment,
								...[...Array(len).keys()].map(_ => row)
							]

							// TODO: 改行コードってそのまま挿入するのまずそう、フォーマッターもそうだけど、検証が必要。
							.join("\n");

							return <CompletionItem>{
								label: `${nbr}x${len}`,
								detail: `Create a new table.`,
								documentation: table.replace(/   /g, ' A '),
								insertText: table
							};
						});						
					}
				}
				return [];
			}
		},
		'x'
	));

	
}



// this method is called when your extension is deactivated
export function deactivate() {


	if(mdTableEditor)
	{
		mdTableEditor.dispose();
	}

}


